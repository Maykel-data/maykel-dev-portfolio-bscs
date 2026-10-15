using System;
using System.Drawing;

class Test {
    static void Main() {
        using (Bitmap bmp = new Bitmap("public/images/michael.jpg")) {
            for (int y = 450; y <= 550; y += 25) {
                Console.WriteLine("--- ROW y = " + y + " ---");
                for (int x = 850; x <= 1100; x += 15) {
                    Color c = bmp.GetPixel(x, y);
                    Console.WriteLine("x=" + x + ": R=" + c.R + " G=" + c.G + " B=" + c.B + " (R-B=" + (c.R - c.B) + ")");
                }
            }
        }
    }
}
