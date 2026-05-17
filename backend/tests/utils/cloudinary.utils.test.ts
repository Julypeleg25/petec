import { jest } from "@jest/globals";

type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

type UploadResponse = {
  secure_url?: string;
  public_id?: string;
};

type UploadOptions = {
  public_id: string;
  resource_type: string;
};

type UploadCallback = (error?: Error, result?: UploadResponse) => void;

const randomUUIDMock = jest.fn<() => string>();
const configMock = jest.fn<(config: CloudinaryConfig) => void>();
const uploadStreamMock = jest.fn<
  (options: UploadOptions, callback: UploadCallback) => string
>();
const destroyMock = jest.fn<(publicId: string) => Promise<void>>();
const pipeMock = jest.fn<(stream: string) => void>();
const createReadStreamMock = jest.fn<
  (buffer: Buffer) => { pipe: typeof pipeMock }
>();
const sanitizeUploadedFileNameMock = jest.fn<
  (fileName: string | undefined, fallbackFileName: string) => string
>();
const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();

const loadCloudinaryUtils = async (
  envOverrides: Partial<Record<string, string>> = {},
) => {
  jest.resetModules();
  randomUUIDMock.mockReset();
  configMock.mockReset();
  uploadStreamMock.mockReset();
  destroyMock.mockReset();
  createReadStreamMock.mockReset();
  pipeMock.mockReset();
  sanitizeUploadedFileNameMock.mockReset();
  infoMock.mockReset();
  warnMock.mockReset();
  errorMock.mockReset();

  randomUUIDMock.mockReturnValue("1234-5678");
  createReadStreamMock.mockReturnValue({
    pipe: pipeMock,
  });
  sanitizeUploadedFileNameMock.mockImplementation(
    (fileName: string | undefined, fallbackFileName: string) =>
      fileName ?? fallbackFileName,
  );

  jest.unstable_mockModule("crypto", () => ({
    randomUUID: randomUUIDMock,
  }));

  jest.unstable_mockModule("cloudinary", () => ({
    v2: {
      config: configMock,
      uploader: {
        upload_stream: uploadStreamMock,
        destroy: destroyMock,
      },
    },
  }));

  jest.unstable_mockModule("streamifier", () => ({
    default: {
      createReadStream: createReadStreamMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      cloudinaryCloudName: "cloud-name",
      cloudinaryApiKey: "api-key",
      cloudinaryApiSecret: "api-secret",
      ...envOverrides,
    },
  }));

  jest.unstable_mockModule("../../src/config/logger.js", () => ({
    logger: {
      info: infoMock,
      warn: warnMock,
      error: errorMock,
    },
  }));

  jest.unstable_mockModule("../../src/utils/uploadFile.utils.js", () => ({
    sanitizeUploadedFileName: sanitizeUploadedFileNameMock,
  }));

  return import("../../src/utils/cloudinary.utils.js");
};

describe("cloudinary.utils", () => {
  it("rejects uploads when Cloudinary credentials are missing", async () => {
    const { uploadToCloudinary } = await loadCloudinaryUtils({
      cloudinaryCloudName: "",
    });

    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image"),
        originalName: "milo.png",
        folder: "patients/photos",
        fallbackBaseName: "patient-1",
      }),
    ).rejects.toThrow("Cloudinary is not configured");

    expect(configMock).not.toHaveBeenCalled();
    expect(errorMock).toHaveBeenCalledWith(
      "Error processing Cloudinary upload",
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
  });

  it("uploads images and configures Cloudinary only once per loaded module", async () => {
    const { uploadToCloudinary } = await loadCloudinaryUtils();
    sanitizeUploadedFileNameMock.mockReturnValue("milo.png");
    uploadStreamMock.mockImplementation(
      (options, callback) => {
        callback(undefined, {
          secure_url: `https://cdn.test/${options.public_id}.png`,
          public_id: options.public_id,
        });
        return "upload-stream";
      },
    );

    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image-1"),
        originalName: "milo.png",
        folder: "patients/photos",
        fallbackBaseName: "patient-1",
      }),
    ).resolves.toEqual({
      secureUrl: "https://cdn.test/patients/photos/milo-12345678.png",
      publicId: "patients/photos/milo-12345678",
    });

    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image-2"),
        originalName: "milo.png",
        folder: "patients/photos",
        fallbackBaseName: "patient-1",
      }),
    ).resolves.toEqual({
      secureUrl: "https://cdn.test/patients/photos/milo-12345678.png",
      publicId: "patients/photos/milo-12345678",
    });

    expect(configMock).toHaveBeenCalledTimes(1);
    expect(sanitizeUploadedFileNameMock).toHaveBeenCalledWith(
      "milo.png",
      "patient-1",
    );
    expect(uploadStreamMock).toHaveBeenNthCalledWith(
      1,
      {
        resource_type: "image",
        public_id: "patients/photos/milo-12345678",
      },
      expect.any(Function),
    );
    expect(createReadStreamMock).toHaveBeenCalledWith(Buffer.from("image-1"));
    expect(pipeMock).toHaveBeenCalledWith("upload-stream");
  });

  it("wraps upload stream failures and missing Cloudinary metadata", async () => {
    const { uploadToCloudinary } = await loadCloudinaryUtils();
    sanitizeUploadedFileNameMock.mockReturnValue("milo.png");

    uploadStreamMock.mockImplementationOnce(
      (_options, callback) => {
        callback(new Error("upload failed"));
        return "upload-stream";
      },
    );

    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image"),
        originalName: "milo.png",
        folder: "patients/photos",
        fallbackBaseName: "patient-1",
      }),
    ).rejects.toThrow("Error uploading image to Cloudinary");

    uploadStreamMock.mockImplementationOnce(
      (_options, callback) => {
        callback(undefined, {});
        return "upload-stream";
      },
    );

    await expect(
      uploadToCloudinary({
        buffer: Buffer.from("image"),
        originalName: "milo.png",
        folder: "patients/photos",
        fallbackBaseName: "patient-1",
      }),
    ).rejects.toThrow("Cloudinary upload did not return asset metadata");

    expect(errorMock).toHaveBeenCalledWith(
      "Error uploading image to Cloudinary",
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
  });

  it("deletes assets by direct public id and parsed Cloudinary url", async () => {
    const { deleteFromCloudinary } = await loadCloudinaryUtils();
    destroyMock.mockResolvedValue(undefined);

    await deleteFromCloudinary("patients/photos/direct-id");
    await deleteFromCloudinary(
      "https://res.cloudinary.com/demo/image/upload/v123/patients/photos/milo.jpg",
    );

    expect(destroyMock).toHaveBeenNthCalledWith(1, "patients/photos/direct-id");
    expect(destroyMock).toHaveBeenNthCalledWith(2, "patients/photos/milo");
    expect(infoMock).toHaveBeenNthCalledWith(1, "Deleted image from Cloudinary", {
      publicId: "patients/photos/direct-id",
    });
    expect(infoMock).toHaveBeenNthCalledWith(2, "Deleted image from Cloudinary", {
      publicId: "patients/photos/milo",
    });
  });

  it("warns when a public id cannot be resolved and swallows delete failures", async () => {
    const { deleteFromCloudinary } = await loadCloudinaryUtils();
    destroyMock.mockRejectedValue(new Error("api unavailable"));

    await deleteFromCloudinary("https://res.cloudinary.com/demo/image/private/no-upload/path.jpg");
    await deleteFromCloudinary("patients/photos/direct-id");

    expect(warnMock).toHaveBeenCalledWith(
      "Skipping Cloudinary delete because public id could not be resolved",
      {
        public_id_or_url:
          "https://res.cloudinary.com/demo/image/private/no-upload/path.jpg",
      },
    );
    expect(errorMock).toHaveBeenCalledWith(
      "Error deleting image from Cloudinary",
      {
        error: expect.any(Error),
        publicIdOrUrl: "patients/photos/direct-id",
      },
    );
  });

  it("warns for malformed Cloudinary urls that cannot resolve a public id", async () => {
    const { deleteFromCloudinary } = await loadCloudinaryUtils();

    await deleteFromCloudinary(
      "https://res.cloudinary.com/demo/image/upload/v123",
    );
    await deleteFromCloudinary("http://%");

    expect(warnMock).toHaveBeenNthCalledWith(
      1,
      "Skipping Cloudinary delete because public id could not be resolved",
      {
        public_id_or_url: "https://res.cloudinary.com/demo/image/upload/v123",
      },
    );
    expect(warnMock).toHaveBeenNthCalledWith(
      2,
      "Skipping Cloudinary delete because public id could not be resolved",
      {
        public_id_or_url: "http://%",
      },
    );
    expect(destroyMock).not.toHaveBeenCalled();
  });
});
