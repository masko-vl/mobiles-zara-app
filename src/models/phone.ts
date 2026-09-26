// Data shapes returned by the phones API. Field names and optionality mirror
// the responses captured from the real endpoints (see .env.example base URL).

export interface PhoneSummary {
  id: string;
  brand: string;
  name: string;
  basePrice: number;
  imageUrl: string;
}

export interface PhoneSpecs {
  screen: string;
  resolution: string;
  processor: string;
  mainCamera: string;
  selfieCamera: string;
  battery: string;
  os: string;
  screenRefreshRate: string;
}

export interface ColorOption {
  name: string;
  hexCode: string;
  /** Image of the phone in this exact color. */
  imageUrl: string;
}

export interface StorageOption {
  capacity: string;
  /**
   * Total price for this capacity (NOT a delta on top of basePrice).
   * Verified against the API: for the Galaxy S24 Ultra, basePrice 1329 equals
   * the 512 GB option while 256 GB costs 1229 and 1 TB costs 1529.
   */
  price: number;
}

export interface PhoneDetail extends Omit<PhoneSummary, 'imageUrl'> {
  description: string;
  rating: number;
  specs: PhoneSpecs;
  colorOptions: ColorOption[];
  storageOptions: StorageOption[];
  /** Related products, already computed by the API. */
  similarProducts: PhoneSummary[];
  /**
   * NOT present in the raw API detail payload: the service fills it from the
   * first color option, so the UI can always rely on a default image.
   */
  imageUrl: string;
}
