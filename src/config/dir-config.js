const path = require("path");

function getPaths(env) {
  if (!env) {
    env = process.env.NODE_ENV || "development";
    console.log(`Dir config, No environment specified, defaulting to '${env}'`);
  }

  const publicPath =
    env === "production"
      ? path.resolve("/nfs/flom_v1/public/")
      : path.resolve(__dirname, "../..", "public");
  const uploadPath =
    env === "production"
      ? path.resolve("/nfs/flom_v1/uploads/")
      : path.resolve(__dirname, "../..", "public/uploads/");

  const paths = Object.freeze({
    production: {
      carrierLogoPath: path.resolve(publicPath, "logos/carrier_logos"),
      paymentMethodLogoPath: path.resolve(publicPath, "logos/payment_method_logos"),
      idPhotosPath: path.resolve(uploadPath, "id_photos"),
      wallpaperPath: path.resolve(publicPath, "wallpapers"),
      soundalikePath: path.resolve(__dirname, "../../..", "soundalike/soundalike"),
      supportFilesPath: path.resolve(uploadPath, "support"),
    },
    development: {
      carrierLogoPath: path.resolve(publicPath, "logos/carrier_logos"),
      paymentMethodLogoPath: path.resolve(publicPath, "logos/payment_method_logos"),
      idPhotosPath: path.resolve(uploadPath, "id_photos"),
      wallpaperPath: path.resolve(publicPath, "wallpapers"),
      soundalikePath: path.resolve(__dirname, "../../../../../..", "soundalike/soundalike"),
      supportFilesPath: path.resolve(uploadPath, "support"),
    },
    local: {
      carrierLogoPath: path.resolve(publicPath, "logos/carrier_logos"),
      paymentMethodLogoPath: path.resolve(publicPath, "logos/payment_method_logos"),
      idPhotosPath: path.resolve(uploadPath, "id_photos"),
      wallpaperPath: path.resolve(publicPath, "wallpapers"),
      soundalikePath: path.resolve(__dirname, "../../../../../..", "soundalike/soundalike"),
      supportFilesPath: path.resolve(uploadPath, "support"),
    },
  });

  if (!paths[env]) {
    console.log(`Dir config, No paths found for environment '${env}', defaulting to 'development'`);
  }

  return paths[env] || paths.development;
}

module.exports = getPaths;
