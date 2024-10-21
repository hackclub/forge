import { Fira_Code as FontMono} from "next/font/google";
import { Grenze as FontSans} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: "600"
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
