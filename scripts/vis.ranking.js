const VisRanking = new function () {
  const that = this;

  /**
   * 모델들과 성능 기준을 입력받아 클래스 별 모델별 성능 순위 배열을 반환한다.
   * @param models
   * @param criteria: 성능 계산 기준 (eg. recall, precision)
   * @param classes
   */
  this.getRankingBy = (models, criteria, classes) => {
    const performances = that.getPerformanceBy(models, criteria, classes);
    const ranking = {};
    _.forEach(classes, (className) => {
      const classPerformance = [];
      _.forEach(performances, (modelPerformance, modelName) => {
        classPerformance.push({
          modelName: modelName,
          performance: 1 - modelPerformance[className],
          accuracy: 1 - models[modelName].performance.accuracy
        });
      });
      const sorted = _.sortBy(classPerformance, ['performance', 'accuracy', 'modelName'])
      ranking[className] = _.map(sorted, e => e.modelName);
    });
    return ranking;
  };

  /**
   * 모델들과 성능 기준을 입력받아 모델/클래스 성능 배열(2D)을 반환한다. 
   * 각 배열의 첫 요소는 각 모델의 전체 클래스 평균 성능이다.
   * @param models 
   * @param criteria: 성능 계산 기준 (eg. recall, precision)
   * @param classes
   */
  this.getPerformanceBy = (models, criteria, classes) => {
    const performances = {};
    _.forEach(models, (model, modelName) => {
      performances[modelName] = that.getOerformanceByClasses(model, criteria, classes);
      performances[modelName]['accuracy'] = model.performance.accuracy
    });
    return performances;
  }

  /**
   * 하나의 모델과 성능 기준, 그리고 클래스 이름들을 입력받는다.
   * 모델/클래스 성능 배열(1D)을 반환한다. 
   * @param model
   * @param criteria: 성능 계산 기준 (eg. recall, precision)
   * @param classes
   */
  this.getOerformanceByClasses = (model, criteria, classes) => {
    const performance = model.performance[criteria];
    const filterd = {};
    _.forEach(classes, (c) => {
      filterd[c] = performance[c];
    })
    return filterd;
  }

  return this;
}

console.log(VisRanking);