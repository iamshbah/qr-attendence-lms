declare module "qrcode" {
  export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  export interface QRCodeOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: ErrorCorrectionLevel;
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
}
