using System;
using System.Drawing;
using System.Drawing.Imaging;

class Program {
    static void Main() {
        string inputPath = "public/images/michael.jpg";
        string outputPath = "public/images/michael-transparent.png";

        using (Bitmap bmp = new Bitmap(inputPath)) {
            int w = bmp.Width;
            int h = bmp.Height;

            BitmapData srcData = bmp.LockBits(
                new Rectangle(0, 0, w, h),
                ImageLockMode.ReadOnly,
                PixelFormat.Format24bppRgb
            );

            int stride = srcData.Stride;
            byte[] bytes = new byte[stride * h];
            System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, bytes, 0, bytes.Length);
            bmp.UnlockBits(srcData);

            // Function to check if a pixel is clearly studio background
            // Studio background in michael.jpg: R > 220, G > 220, B > 220, neutral |R-B| <= 10
            Func<int, int, bool> isBgPixel = (x, y) => {
                if (x < 0 || x >= w || y < 0 || y >= h) return true;
                int idx = y * stride + x * 3;
                int b = bytes[idx];
                int g = bytes[idx + 1];
                int r = bytes[idx + 2];

                // Bright neutral studio background
                if (r < 210 || g < 210 || b < 210) return false;
                if (Math.Abs(r - g) > 12 || Math.Abs(g - b) > 12 || Math.Abs(r - b) > 12) return false;
                // If R - B > 12, it has skin warmth!
                if (r - b > 12) return false;
                return true;
            };

            // Top boundary for each column x
            int[] yTop = new int[w];
            for (int x = 0; x < w; x++) {
                int y = 0;
                while (y < h && isBgPixel(x, y)) {
                    y++;
                }
                yTop[x] = y;
            }

            // Left boundary and right boundary for each row y
            int[] xLeft = new int[h];
            int[] xRight = new int[h];

            int midX = w / 2;

            for (int y = 0; y < h; y++) {
                // Left edge scan
                int xl = 0;
                while (xl < midX && isBgPixel(xl, y)) {
                    xl++;
                }
                xLeft[y] = xl;

                // Right edge scan
                int xr = w - 1;
                while (xr > midX && isBgPixel(xr, y)) {
                    xr--;
                }
                xRight[y] = xr;
            }

            // Clean 32bpp output bitmap
            using (Bitmap outBmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                BitmapData outData = outBmp.LockBits(
                    new Rectangle(0, 0, w, h),
                    ImageLockMode.WriteOnly,
                    PixelFormat.Format32bppArgb
                );

                int outStride = outData.Stride;
                byte[] outBytes = new byte[outStride * h];

                for (int y = 0; y < h; y++) {
                    int xl = xLeft[y];
                    int xr = xRight[y];

                    for (int x = 0; x < w; x++) {
                        int srcIdx = y * stride + x * 3;
                        int outIdx = y * outStride + x * 4;

                        byte b = bytes[srcIdx];
                        byte g = bytes[srcIdx + 1];
                        byte r = bytes[srcIdx + 2];

                        outBytes[outIdx] = b;
                        outBytes[outIdx + 1] = g;
                        outBytes[outIdx + 2] = r;

                        // Check if pixel is inside Michael's silhouette
                        if (y < yTop[x] || x < xl || x > xr) {
                            outBytes[outIdx + 3] = 0; // Pure transparent background
                        } else {
                            // Feather 2-3px at edges for smooth anti-aliased contour
                            int distToEdge = Math.Min(
                                Math.Min(x - xl, xr - x),
                                y - yTop[x]
                            );

                            if (distToEdge <= 0) {
                                outBytes[outIdx + 3] = 80;
                            } else if (distToEdge == 1) {
                                outBytes[outIdx + 3] = 160;
                            } else if (distToEdge == 2) {
                                outBytes[outIdx + 3] = 220;
                            } else {
                                outBytes[outIdx + 3] = 255; // 100% solid
                            }
                        }
                    }
                }

                System.Runtime.InteropServices.Marshal.Copy(outBytes, 0, outData.Scan0, outBytes.Length);
                outBmp.UnlockBits(outData);
                outBmp.Save(outputPath, ImageFormat.Png);
                Console.WriteLine("Successfully created perfect silhouette cutout: " + outputPath);
            }
        }
    }
}
