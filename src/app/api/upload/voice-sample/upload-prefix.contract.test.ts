import {
  isVoiceSampleUploadKeyPrefix,
  type VoiceSampleUploadKeyPrefix,
} from "@/app/api/upload/voice-sample/route";

const interviewPrefix: VoiceSampleUploadKeyPrefix = "interview";

if (!isVoiceSampleUploadKeyPrefix(interviewPrefix)) {
  throw new Error("Interview voice upload prefix should be accepted.");
}
