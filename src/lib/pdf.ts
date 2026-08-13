import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
type Contract = {
  business: string;
  customer: string;
  title: string;
  totalCents: number;
  terms: string;
  acceptedAt?: string;
};
export async function contractPdf(c: Contract) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 790;
  const line = (text: string, size = 11, b = false) => {
    page.drawText(text.slice(0, 95), {
      x: 48,
      y,
      size,
      font: b ? bold : font,
      color: rgb(0.08, 0.08, 0.1),
    });
    y -= size + 10;
  };
  line("CONTRATO SIMPLES DE PRESTACAO DE SERVICOS", 16, true);
  line(`Prestador: ${c.business}`);
  line(`Cliente: ${c.customer}`);
  line(`Objeto: ${c.title}`);
  line(
    `Valor: R$ ${(c.totalCents / 100).toFixed(2).replace(".", ",")}`,
    12,
    true,
  );
  y -= 12;
  for (const chunk of c.terms.match(/.{1,90}(?:\s|$)/g) ?? [c.terms])
    line(chunk.trim());
  if (c.acceptedAt) {
    y -= 16;
    line(
      `Aceite eletronico registrado em ${new Date(c.acceptedAt).toLocaleString("pt-BR")}.`,
      10,
    );
  }
  line("Este registro nao constitui assinatura digital qualificada.", 9);
  return pdf.save();
}
