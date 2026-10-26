export type RuntimeUser = {
    userId: string;
    displayName: string;
    email: string;
    fullName: string | null;
};
export type RuntimeEnv = {
    DB: D1Database;
    BUCKET: R2Bucket;
    RESEND_API_KEY?: string;
    MAIL_FROM?: string;
    GA_MEASUREMENT_ID?: string;
    META_PIXEL_ID?: string;
    PARTYPRINT_TRUSTED_COUNTRY_HEADER?: string;
};
