/**
 * Generate a WordPress-style URL slug from a title string.
 * Handles Vietnamese characters and Unicode normalization.
 */

const VI_MAP = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
  â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
}

export function generateSlug(text) {
  if (!text) return 'survey-' + Date.now()

  let slug = text.toLowerCase()

  // Replace Vietnamese characters
  slug = slug.replace(/[àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g,
    (char) => VI_MAP[char] || char
  )

  // Remove accents from remaining Unicode
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Replace non-alphanumeric with hyphen
  slug = slug.replace(/[^a-z0-9]+/g, '-')

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '')

  // Limit length
  if (slug.length > 80) {
    slug = slug.substring(0, 80).replace(/-+$/, '')
  }

  return slug || 'survey-' + Date.now()
}
