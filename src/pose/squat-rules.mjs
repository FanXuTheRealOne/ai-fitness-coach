export function squatFormIssues(f) {
  const out = [];
  const squatting = f.kneeAngle < 150;
  const bottom = f.kneeAngle < 112 || f.hipBelowKnee > 0;

  if (squatting && f.kneeValgus > 0.38) {
    out.push({ code: "valgus", message: "膝盖对准脚尖，别内扣", speak: "膝盖向外，对准脚尖，别内扣" });
  }

  if (f.footVisible && f.footSplay > 48) {
    out.push({ code: "footout", message: "脚尖收一点，别太外八", speak: "脚尖收一点，别太外八" });
  } else if (f.footVisible && f.footSplay < -8) {
    out.push({ code: "footin", message: "脚尖朝前，别内八", speak: "脚尖朝前，别内八字" });
  }

  if (bottom && f.bodyStraightness < 160) {
    out.push({ code: "buttwink", message: "骨盆别卷，腰背保持中立", speak: "骨盆别卷，腰背保持中立，收紧核心" });
  }

  if (squatting && f.torsoInclination > 50) {
    out.push({ code: "back", message: "挺胸收背，别弓腰", speak: "挺胸，背别弓" });
  }

  if (f.kneeAngle > 105 && f.kneeAngle < 145) {
    out.push({ code: "depth", message: "再蹲低，大腿到水平", speak: "再蹲低一点，蹲到大腿水平" });
  }

  return out;
}
