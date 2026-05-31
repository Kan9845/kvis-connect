import { AvatarConfig } from "@/lib/avatarTypes";

export const avatarOptions = {
  background: [
    "bg_blue",
    "bg_pink",
    "bg_green",
    "bg_yellow",
  ],

  eyes: [
    "eye_default",
    "eye_sleepy",
    "eye_pretty",
    "eye_lashes",
    "eye_confused",
  ],

  brows: [
    "brows_line",
    "brows_shinchan",
    "brows_tied",
    "brows_up",
  ],

  hair: [
    "littlehair_bang",
    "littlehair_chicken",
    "littlehair_mount",
    "littlehair_curl",
    "littlehair_curly",
  ],

  head: [
    "head_hat",
    "head_headphone",
    "head_bday",
    "head_bowmiddle",
    "head_bowside",
    "head_flower",
    "head_funny",
  ],

  glasses: [
    "glasses_gojo",
    "glasses_normal",
    "glasses_mono",
  ],

  cheek: [
    "blush_cheek",
    "beak_piercing",
  ],

  neck: [
    "neck_tie",
    "neck_lace",
    "neck_strap",
    "neck_bow",
    "neck_bigbow",
  ],

  hand: [
  "hand_lab",
  "hand_mic",
],
};

export const defaultAvatar: AvatarConfig = {
  background: "bg_blue",
  eyes: "eye_default",

  brows: null,
  hair: null,
  head: null,
  glasses: null,
  cheek: null,
  neck: null,
  hand: null,
};