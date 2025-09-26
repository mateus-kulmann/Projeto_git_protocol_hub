export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a Brazilian number
  if (cleaned.length === 11) {
    // Format as (XX) XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Format as (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // International Brazilian format +55 XX XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 $2 $3-$4');
  }
  
  // Return original if no pattern matches
  return phoneNumber;
};

export const cleanPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  return phoneNumber.replace(/\D/g, '');
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = cleanPhoneNumber(phoneNumber);
  
  // Brazilian phone numbers: 10 or 11 digits (with area code)
  // International: 13 digits starting with 55 (Brazil code)
  return /^(\d{10}|\d{11}|55\d{11})$/.test(cleaned);
};
