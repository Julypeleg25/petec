import { toHighResolutionCloudinaryUrl } from "@petec/shared";

describe("toHighResolutionCloudinaryUrl", () => {
  it("injects high-resolution delivery transforms into a plain Cloudinary upload URL", () => {
    const source =
      "https://res.cloudinary.com/demo/image/upload/v123/patients/photos/milo.jpg";

    expect(toHighResolutionCloudinaryUrl(source)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:best,c_limit,w_1200,dpr_auto/v123/patients/photos/milo.jpg",
    );
  });

  it("replaces existing low-resolution transforms instead of stacking them", () => {
    const source =
      "https://res.cloudinary.com/demo/image/upload/w_150,c_fill,q_40/v123/patients/photos/milo.jpg";

    expect(toHighResolutionCloudinaryUrl(source)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:best,c_limit,w_1200,dpr_auto/v123/patients/photos/milo.jpg",
    );
  });

  it("leaves non-Cloudinary URLs unchanged", () => {
    const source = "/api/patient/photo/abc123?v=1";

    expect(toHighResolutionCloudinaryUrl(source)).toBe(source);
  });

  it("is idempotent when high-resolution transforms are already present", () => {
    const source =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:best,c_limit,w_1200,dpr_auto/v123/patients/photos/milo.jpg";

    expect(toHighResolutionCloudinaryUrl(source)).toBe(source);
  });
});
