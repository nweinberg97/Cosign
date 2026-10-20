// Stock photography from Unsplash (https://unsplash.com/license), hotlinked from
// Unsplash's image CDN. Portraits show models, not the fictional people they
// illustrate. If an image can't load, the app falls back to initials.

export interface Photo {
  src: string;
  photographer: string;
  page: string;
}

const u = (id: string, photographer: string, page: string): Photo => ({
  src: `https://images.unsplash.com/${id}`,
  photographer,
  page,
});

/** Headshots for the fictional merchants. */
export const PORTRAITS: Record<string, Photo> = {
  "u-maya": u("photo-1600481176431-47ad2ab2745d", "panitan punpuang", "https://unsplash.com/photos/woman-in-black-shirt-smiling-OuxJHYeUYpk"),
  "u-jordan": u("photo-1769636929354-59165ba73c7e", "Jadon Johnson", "https://unsplash.com/photos/a-smiling-black-man-wearing-a-black-sweatshirt-aPnIGxGUV68"),
  "u-alex": u("photo-1656338997878-279d71d48f6e", "Lance Reis", "https://unsplash.com/photos/a-man-with-a-beard-pp76Y6Fq6xw"),
  "u-priya": u("photo-1789500381106-ba13068a6520", "Parimal Jain", "https://unsplash.com/photos/woman-in-red-patterned-sweater-MHg6J6m_eqI"),
  "u-sam": u("photo-1500648767791-00dcc994a43e", "Jurica Koletić", "https://unsplash.com/photos/man-wearing-henley-top-portrait-7YVZYZeITc8"),
  "u-lena": u("photo-1668876220471-c91598757e65", "oktavianus mulyadi", "https://unsplash.com/photos/a-person-with-dark-hair-N6Pfi3d8duc"),
  "u-diego": u("photo-1525457136159-8878648a7ad0", "Gabriel Arancibia", "https://unsplash.com/photos/man-in-brown-coat-standing-near-concrete-wall-smiles-wYvCXc-xUTg"),
  "u-hana": u("photo-1790574340539-9ee95b457061", "Vitaly Gariev", "https://unsplash.com/photos/smiling-woman-with-dark-wavy-hair-xHn_UJraR20"),
  "u-theo": u("photo-1583692331507-fc0bd348695d", "Duman Photography", "https://unsplash.com/photos/man-in-gray-hoodie-smiling-w3JKo9UgXFY"),
  "u-amara": u("photo-1754844362137-88441eb7cc6f", "JEaLiFe Pictures", "https://unsplash.com/photos/close-up-of-a-smiling-woman-with-braided-hair-JiZTPRLsa0Q"),
};

/** A product or shop photo for each fictional business. */
export const COVERS: Record<string, Photo> = {
  "u-maya": u("photo-1748543668676-ea8241cb3886", "ibnu ihza", "https://unsplash.com/photos/skincare-products-with-leaves-on-a-light-background-g6q3lFAe3kA"),
  "u-jordan": u("photo-1610701596007-11502861dcfa", "Vladimir Gladkov", "https://unsplash.com/photos/white-and-brown-ceramic-bowls-NPPIq1XFdck"),
  "u-alex": u("photo-1516648064-ee10acfa64db", "Al Elmes", "https://unsplash.com/photos/man-standing-on-pathway-in-between-snow-field-p7_B_aebJLE"),
  "u-priya": u("photo-1580116270858-8a0d62b15426", "Heather McKean", "https://unsplash.com/photos/a-shelf-filled-with-lots-of-different-types-of-spices-1I9bMlIAIBM"),
  "u-sam": u("photo-1601479604588-68d9e6d386b5", "Sixteen Miles Out", "https://unsplash.com/photos/white-pillar-candles-on-brown-wooden-table-bdVmIkx_gIs"),
  "u-lena": u("photo-1524894200781-78730fa3d63e", "Artem Beliaikin", "https://unsplash.com/photos/hanged-bikinis-L4vmA1-W00A"),
  "u-diego": u("photo-1558160074-4d7d8bdf4256", "Manki Kim", "https://unsplash.com/photos/clear-glass-cup-with-tea-near-brown-ceramic-teapot-L82-kkEBOd0"),
  "u-hana": u("photo-1605884878538-6468614df578", "Maxim Mox", "https://unsplash.com/photos/silver-chain-link-bracelet-on-white-surface-aW6unMK5l2E"),
  "u-theo": u("photo-1501618669935-18b6ecb13d6d", "Mike Tinnion", "https://unsplash.com/photos/black-and-silver-retractable-pen-on-blank-book-3ym6i13Y9LU"),
  "u-amara": u("photo-1524350876685-274059332603", "Tina Guina", "https://unsplash.com/photos/shallow-focus-photography-of-coffee-beans-in-sack-obV_LM0KjxY"),
};

/** Sized, face-cropped variant of an Unsplash photo. */
export function sized(photo: Photo, w: number, h = w, faces = true): string {
  return `${photo.src}?w=${w}&h=${h}&fit=crop${faces ? "&crop=faces" : ""}&auto=format&q=70`;
}
