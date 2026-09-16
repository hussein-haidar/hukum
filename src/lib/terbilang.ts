const ANGKA = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

function sebut(n: number): string {
  if (n < 12) return ANGKA[n];
  if (n < 20) return sebut(n - 10) + " belas";
  if (n < 100) return sebut(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + sebut(n % 10) : "");
  if (n < 200) return "seratus" + (n % 100 ? " " + sebut(n % 100) : "");
  if (n < 1000) return sebut(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + sebut(n % 100) : "");
  if (n < 2000) return "seribu" + (n % 1000 ? " " + sebut(n % 1000) : "");
  if (n < 1000000) return sebut(Math.floor(n / 1000)) + " ribu" + (n % 1000 ? " " + sebut(n % 1000) : "");
  if (n < 1000000000) return sebut(Math.floor(n / 1000000)) + " juta" + (n % 1000000 ? " " + sebut(n % 1000000) : "");
  if (n < 1000000000000)
    return sebut(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 ? " " + sebut(n % 1000000000) : "");
  return sebut(Math.floor(n / 1000000000000)) + " triliun" + (n % 1000000000000 ? " " + sebut(n % 1000000000000) : "");
}

export function terbilang(value: string | number): string {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."))
      : value;

  if (isNaN(num) || num < 0) return "";

  const rounded = Math.round(num * 100);
  const rupiah = Math.floor(rounded / 100);
  const sen = rounded % 100;

  let words = rupiah === 0 ? "nol" : sebut(rupiah);
  if (sen > 0) {
    words += " koma " + sebut(sen);
  }
  if (words === "nol") words = "nol rupiah";
  else words += " rupiah";

  return words.charAt(0).toUpperCase() + words.slice(1);
}