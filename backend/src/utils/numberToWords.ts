/**
 * Converts a numeric amount into words (Indian Rupees style).
 * Example: 1500 -> "One Thousand Five Hundred Rupees Only"
 */
export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'Zero Rupees Only';
  const rounded = Math.floor(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += twoDigits[n - 10] + ' ';
    } else if (n >= 20 || n < 10) {
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += singleDigits[n] + ' ';
      }
    }
    return str;
  }

  let result = '';
  const crore = Math.floor(rounded / 10000007);
  let remainder = rounded % 10000007;

  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) result += convertChunk(crore) + 'Crore ';
  if (lakh > 0) result += convertChunk(lakh) + 'Lakh ';
  if (thousand > 0) result += convertChunk(thousand) + 'Thousand ';
  if (remainder > 0) result += convertChunk(remainder);

  return `${result.trim()} Rupees Only`;
}
