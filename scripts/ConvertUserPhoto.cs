using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

class Program {
    static void Main() {
        string inputPath = "bf05b164-24e3-4916-86a2-d6276d9cd211.jpg";
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

            bool[] isBg = new bool[w * h];
            Queue<int> q = new Queue<int>();

            Func<int, int, bool> isDarkBg = (x, y) => {
                int idx = y * stride + x * 3;
                byte b = bytes[idx];
                byte g = bytes[idx + 1];
                byte r = bytes[idx + 2];
                return r <= 4 && g <= 4 && b <= 4;
            };

            // Seed BFS from all borders
            for (int x = 0; x < w; x++) {
                if (isDarkBg(x, 0)) { isBg[0 * w + x] = true; q.Enqueue(0 * w + x); }
                if (isDarkBg(x, h - 1)) { isBg[(h - 1) * w + x] = true; q.Enqueue((h - 1) * w + x); }
            }
            for (int y = 0; y < h; y++) {
                if (isDarkBg(0, y) && !isBg[y * w + 0]) { isBg[y * w + 0] = true; q.Enqueue(y * w + 0); }
                if (isDarkBg(w - 1, y) && !isBg[y * w + (w - 1)]) { isBg[y * w + (w - 1)] = true; q.Enqueue(y * w + (w - 1)); }
            }

            int[] dx = { 0, 0, 1, -1 };
            int[] dy = { 1, -1, 0, 0 };

            while (q.Count > 0) {
                int curr = q.Dequeue();
                int cx = curr % w;
                int cy = curr / w;

                for (int i = 0; i < 4; i++) {
                    int nx = cx + dx[i];
                    int ny = cy + dy[i];

                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        int nidx = ny * w + nx;
                        if (!isBg[nidx] && isDarkBg(nx, ny)) {
                            isBg[nidx] = true;
                            q.Enqueue(nidx);
                        }
                    }
                }
            }

            using (Bitmap outBmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                BitmapData outData = outBmp.LockBits(
                    new Rectangle(0, 0, w, h),
                    ImageLockMode.WriteOnly,
                    PixelFormat.Format32bppArgb
                );

                int outStride = outData.Stride;
                byte[] outBytes = new byte[outStride * h];

                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int srcIdx = y * stride + x * 3;
                        int outIdx = y * outStride + x * 4;

                        byte b = bytes[srcIdx];
                        byte g = bytes[srcIdx + 1];
                        byte r = bytes[srcIdx + 2];

                        outBytes[outIdx] = b;
                        outBytes[outIdx + 1] = g;
                        outBytes[outIdx + 2] = r;

                        if (isBg[y * w + x]) {
                            outBytes[outIdx + 3] = 0; // Pure transparent
                        } else {
                            outBytes[outIdx + 3] = 255; // 100% solid
                        }
                    }
                }

                System.Runtime.InteropServices.Marshal.Copy(outBytes, 0, outData.Scan0, outBytes.Length);
                outBmp.UnlockBits(outData);
                outBmp.Save(outputPath, ImageFormat.Png);
                Console.WriteLine("Done! Created perfect transparent PNG from user photo: " + outputPath);
            }
        }
    }
}
