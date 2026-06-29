import mongoose, { Document, Schema } from 'mongoose';

// Single global WhatsApp-config document. Holds the Meta WhatsApp Cloud API
// credentials the office pastes from the Meta for Developers dashboard.
// Admin-only. The access token is a secret — never expose it to non-admins.

export interface IWhatsAppSettings extends Document {
  phoneNumberId: string;        // Meta "Phone Number ID"
  wabaId: string;               // WhatsApp Business Account ID
  accessToken: string;          // permanent System-User token (or temp test token)
  apiVersion: string;           // graph API version, e.g. v21.0
  enabled: boolean;             // master on/off switch
  senderLabel: string;          // friendly name for the sending number (display only)
}

const WhatsAppSettingsSchema = new Schema<IWhatsAppSettings>({
  phoneNumberId: { type: String, default: '' },
  wabaId: { type: String, default: '' },
  accessToken: { type: String, default: '' },
  apiVersion: { type: String, default: 'v21.0' },
  enabled: { type: Boolean, default: false },
  senderLabel: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.WhatsAppSettings ||
  mongoose.model<IWhatsAppSettings>('WhatsAppSettings', WhatsAppSettingsSchema);
