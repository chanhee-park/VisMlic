// 그리는 것 말고 다른 계산은 여기서 처리할까
const VisRanking = new function () {
  const that = this;

  /**
   * 퍼포먼스를 입력받아 랭킹 라인에 그릴 원의 반지름을 반환한다.   
   * 퍼포먼스는 0~100 사이의 값(확률 값)이다. 
   */
  this.getRadius = (performance, maxR, minR, maxVal, minVal) => {
    return (maxR - minR) * (performance - minVal) / (maxVal - minVal) + minR;
  }

  /**
   * 퍼포먼스를 입력받아 히트맵에 사용할 컬러를 반환한다.
   * 퍼포먼스는 0~100 사이의 값(확률 값)이다. 
   */
  this.getPerformanceColor = (performance) => {
    // 0.5(black) ~ 0.98(white)
    let rp = performance + 2;     // (0, 100) -> (2, 102)
    rp = rp > 100 ? 100 : rp;     // (2, 102) -> (2, 100)
    rp = (rp - 50) * 2;           // (2, 100) -> (-96, 100)
    rp = rp < 0 ? 0 : rp;         // (-96, 100) -> (0, 100) 
    const c = rp / 100 * 255;
    return `rgb(${c}, ${c}, ${c})`;
  }

  return this;
}

console.log(VisRanking);