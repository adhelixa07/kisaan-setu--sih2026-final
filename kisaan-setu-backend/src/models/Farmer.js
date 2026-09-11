const { Schema, model } = require("mongoose");

const farmerSchema = new Schema(
  {
    farmerId: { type: String, required: true, unique: true }, // e.g. KS-F-482913
    mobile: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
    enamId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    mandi: { type: String, required: true },
    category: { type: String, required: true },
    village: { type: String, default: "" },
    enamVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("Farmer", farmerSchema);
