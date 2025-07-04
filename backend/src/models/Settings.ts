import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  business: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  notifications?: object;
  preferences?: object;
  security?: object;
  termsAndConditions?: string;
}

const SettingsSchema = new Schema<ISettings>({
  business: {
    type: Object,
    default: {},
  },
  notifications: {
    type: Object,
    default: {},
  },
  preferences: {
    type: Object,
    default: {},
  },
  security: {
    type: Object,
    default: {},
  },
  termsAndConditions: {
    type: String,
    default: '',
  },
});

export default mongoose.model<ISettings>('Settings', SettingsSchema); 