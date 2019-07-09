const app = new Vue({
  el: '#app',
  data: {
    title: 'VisMLCV',
    // app.data -> sections
    s_ranking: {
      title: 'Ranking & Confusion Matrix',
      sorting_options: ['recall', 'presicion'],
      WIDTH: 1504,
      HEIGHT: 368,
      LEFT_LEGEND_WIDTH: 120,
      TOP_LEGEND_HEIGHT: 70,
      RANKING_VIS_WIDHT: 1504 - 120,  // WIDTH - LEFT_LEGEND_WIDTH,
      RANKING_VIS_HEIGHT: 368 - 70,   // HEIGHT - TOP_LEGEND_HEIGHT,
      NUM_OF_COLUMNS: null,           // Set when data is loaded.
      CELL_WIDTH: null,
      CELL_HEIGHT: null,
      RANKING_LINE_WIDTH: null,
      HIGHLIGHT_RANKING_LINE_WIDTH: null,
    },
    s_confusion: {
      title: ''
    },
    s_projection: {
      title: '2D Projection'
    },
    s_instances: {
      title: 'Instances'
    },
    // app.data -> dataset
    selecteddata: '',
    dataNames: ['mnist'],
    dataInfo: {
      mnist: {
        classNames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        modelNames: ['rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp'],
        modelNamesALL: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp', 'rfc_10', 'nn_10-layers'],
      }
    },
    // app.data -> models for visualization
    models: {},
    selectedModelName: '',
    rankingCriteria: 'recall'
  },
  methods: {
    /*-------------------------------- D A T A --------------------------------*/
    /**
     * 모델 이름들과 데이터 셋 이름을 입력받아 모델 예측 결과들을 반환한다.
     * @param {*} modelNames 
     * @param {*} dataName 
     */
    getModels: async function (modelNames, dataName) {
      const models = {};
      for (let modelName of modelNames) {
        models[modelName] = await this.getModel(modelName, dataName);
      }
      return models;
    },

    /**
     * 모델 이름 하나와 데이터 셋 이름을 입력받아 해당 모델의 예측 결과를 반환한다.
     * @param {*} modelName 
     * @param {*} dataName
     */
    getModel: async function (modelName, dataName) {
      const dirname = `../data/${dataName}/result/`;
      const filename = `${dataName}_${modelName}__result.json`;
      const response = await fetch(dirname + filename);
      return await response.json();
    },
    /*-------------------------------- D A T A --------------------------------*/
    /*-------------------------------- R A N K I N G --------------------------------*/
    /**
     * 모델 예측 결과들을 입력 받아 랭킹을 시각화 한다. 
     * @param {*} models 
     */
    visualizeRanking: function (models, dataName) {
      console.log(`=> 랭킹 시각화를 생성합니다. visualizeRanking(${{ dataName, models }})`);

      const classNames = this.dataInfo[dataName].classNames;  // Set data infomaition
      const modelNames = _.keys(models);
      const rankingSvg = d3.select('#vis-ranking');           // Set svg

      this.setRankingSectionSize(modelNames, classNames);     // Set size of visual elements

      this.drawRakingLegendTop(rankingSvg, classNames);       // Draw legend - top
      this.drawRakingLegendLeft(rankingSvg, modelNames);      // Draw legend - left

      const rankingByClass = this.getRankingBy(
        models, this.rankingCriteria, classNames);            // Get ranking Info.
      this.drawRankingLines(
        rankingSvg, rankingByClass, models, classNames);      // Draw ranking lines

      VisUtil.sortSvgObjs(rankingSvg, ['circle', 'text']);    // Sort visual elements

      this.addEventRanking(rankingSvg, modelNames);           // Add event listners
    },
    /**
     * 모델들과 성능 기준을 입력받아 클래스 별 모델별 성능 순위 배열을 반환한다.
     * @param models
     * @param criteria: 성능 계산 기준 (eg. recall, precision)
     * @param classes
     */
    getRankingBy: function (models, criteria, classes) {
      const performances = this.getPerformanceBy(models, criteria, classes);
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
    },
    /**
     * 모델들과 성능 기준을 입력받아 모델/클래스 성능 배열(2D)을 반환한다. 
     * 각 배열의 첫 요소는 각 모델의 전체 클래스 평균 성능이다.
     * @param models 
     * @param criteria: 성능 계산 기준 (eg. recall, precision)
     * @param classes
     */
    getPerformanceBy: function (models, criteria, classes) {
      const performances = {};
      _.forEach(models, (model, modelName) => {
        performances[modelName] = this.getOerformanceByClasses(model, criteria, classes);
        performances[modelName]['accuracy'] = model.performance.accuracy
      });
      return performances;
    },
    /**
     * 하나의 모델과 성능 기준, 그리고 클래스 이름들을 입력받는다.
     * 모델/클래스 성능 배열(1D)을 반환한다. 
     * @param model
     * @param criteria: 성능 계산 기준 (eg. recall, precision)
     * @param classes
     */
    getOerformanceByClasses: function (model, criteria, classes) {
      const performance = model.performance[criteria];
      const filterd = {};
      _.forEach(classes, (c) => {
        filterd[c] = performance[c];
      })
      return filterd;
    },
    // 영역 상단에 클래스명 레전드를 그린다.
    drawRakingLegendTop: function (svg, classNames) {
      VisUtil.text(svg, 'Actual Classes',
        { x: this.s_ranking.WIDTH / 2, fill: '#333', size: '24px', baseline: 'hanging' });
      const columnLegends = ['Accuracy', ...classNames];
      _.forEach(columnLegends, (text, i) => {
        const x = this.s_ranking.LEFT_LEGEND_WIDTH + i * this.s_ranking.CELL_WIDTH + this.s_ranking.CELL_WIDTH / 2;
        const y = this.s_ranking.TOP_LEGEND_HEIGHT - 5;
        VisUtil.text(svg, text, { x, y, baseline: 'ideographic' });
      });
    },
    // 영역 내에 모델명 레전드를 그린다. 홀 수 열에는 연한 백그라운드를 표시하여 가독성을 높인다.
    drawRakingLegendLeft: function (svg, modelNames) {
      _.forEach(modelNames, (modelName, i) => {
        const y = this.s_ranking.TOP_LEGEND_HEIGHT + i * this.s_ranking.CELL_HEIGHT;
        const background = (i % 2 === 0) ? '#f3f3f3' : '#ffffff';
        VisUtil.rect(svg, {
          y: y,
          w: this.s_ranking.WIDTH,
          h: this.s_ranking.CELL_HEIGHT,
          fill: background
        });
        // for higlighting
        VisUtil.rect(svg, {
          y: y + (this.s_ranking.CELL_HEIGHT - 30) / 2,
          w: this.s_ranking.LEFT_LEGEND_WIDTH,
          h: 30,
          fill: background,
          class: `ranking-${modelName}`
        });
        const y_text = y + this.s_ranking.CELL_HEIGHT / 2;
        VisUtil.text(svg, modelName, {
          x: 20, y: y_text, anchor: 'start', class: `ranking-${modelName}`
        });
      });
    },
    // set element's size
    setRankingSectionSize: function (modelNames, classNames) {
      this.s_ranking.NUM_OF_COLUMNS = classNames.length + 1;  // Class Cells + An Accuracy Cell
      this.s_ranking.CELL_WIDTH = this.s_ranking.RANKING_VIS_WIDHT / this.s_ranking.NUM_OF_COLUMNS;
      this.s_ranking.CELL_HEIGHT = this.s_ranking.RANKING_VIS_HEIGHT / modelNames.length;
      this.s_ranking.RANKING_LINE_WIDTH = this.s_ranking.CELL_HEIGHT * 0.3;
      this.s_ranking.HIGHLIGHT_RANKING_LINE_WIDTH = this.s_ranking.CELL_HEIGHT * 0.7;
    },
    // draw ranking lines 
    drawRankingLines: function (svg, rankingByClass, models, classNames) {
      const modelNames = _.keys(models);
      _.forEach(modelNames, (modelName, yi) => {
        const modelColor = Constants.colors[modelName];
        let x = this.s_ranking.LEFT_LEGEND_WIDTH;
        let y = this.s_ranking.TOP_LEGEND_HEIGHT + yi * this.s_ranking.CELL_HEIGHT + this.s_ranking.CELL_HEIGHT / 2; // for accuracy
        let performance = Math.floor(models[modelName].performance.accuracy * 100);
        let r = this.getRadius(performance, this.s_ranking.CELL_HEIGHT / 2, 10, 100, 80);
        let heatRgb = this.getPerformanceColor(performance);

        // Whole Accuracy
        VisUtil.circle(svg, {
          x: x + this.s_ranking.CELL_WIDTH / 2,
          y: y,
          r,
          stroke: modelColor,
          fill: heatRgb,
          class: `ranking- ${modelName}`
        });
        VisUtil.text(svg, performance, { x: x + this.s_ranking.CELL_WIDTH / 2, y });
        VisUtil.line(svg, {
          x1: 0,
          x2: this.s_ranking.LEFT_LEGEND_WIDTH + this.s_ranking.CELL_WIDTH / 2,
          y1: y,
          y2: y,
          stroke: Constants.colors[modelName],
          opacity: 0,
          width: this.s_ranking.HIGHLIGHT_RANKING_LINE_WIDTH,
          class: `ranking-${modelName}`
        })
        let pathData = [
          { x: this.s_ranking.LEFT_LEGEND_WIDTH + this.s_ranking.CELL_WIDTH * 0.5, y },
          { x: this.s_ranking.LEFT_LEGEND_WIDTH + this.s_ranking.CELL_WIDTH * 0.8, y }
        ];

        // Recalls or Precisions of each classes
        _.forEach(classNames, (className, xi) => {
          const rank = rankingByClass[className].indexOf(modelName);
          performance = Math.floor(models[modelName].performance[this.rankingCriteria][className] * 100);
          x = this.s_ranking.LEFT_LEGEND_WIDTH + (xi + 1) * this.s_ranking.CELL_WIDTH;
          y = this.s_ranking.TOP_LEGEND_HEIGHT + rank * this.s_ranking.CELL_HEIGHT + this.s_ranking.CELL_HEIGHT / 2;
          r = this.getRadius(performance, this.s_ranking.CELL_HEIGHT / 2, 10, 100, 80);
          heatRgb = this.getPerformanceColor(performance);
          VisUtil.circle(svg, {
            x: x + this.s_ranking.CELL_WIDTH / 2, y, r, stroke: modelColor, fill: heatRgb, class: `ranking-${modelName}`
          })
          VisUtil.text(svg, performance, {
            x: x + this.s_ranking.CELL_WIDTH / 2, y, class: `ranking-${modelName}`
          })
          pathData = [
            ...pathData,
            { x: x + this.s_ranking.CELL_WIDTH * 0.2, y },
            { x: x + this.s_ranking.CELL_WIDTH * 0.8, y }
          ];
        });
        VisUtil.path(svg, pathData, {
          stroke: modelColor,
          width: this.s_ranking.RANKING_LINE_WIDTH,
          class: `ranking-${modelName}`
        });
      });
    },

    // Evnets for visual elements in ranking section.
    addEventRanking: function (svg, modelNames) {
      _.forEach(modelNames, (modelName) => {
        d3.selectAll(`.ranking-${modelName}`)
          .on('mouseover', () => this.mouseOverRanking(svg, modelName))
          .on('mouseout', () => this.mouseOutRanking(svg, modelName))
          .on('mousedown', () => this.mouseDownRanking(svg, modelName));
      })
    },
    mouseOverRanking: function (svg, modelName) {
      this.deHighlightlModelList(svg, _.keys(this.models));
      this.highlightModel(svg, modelName);
      this.highlightModel(svg, this.selectedModelName);
    },
    mouseOutRanking: function (svg) {
      this.deHighlightlModelList(svg, _.keys(this.models));
      this.highlightModel(svg, this.selectedModelName);
    },
    mouseDownRanking: function (svg, modelName) {
      this.selectedModelName = modelName;
      this.deHighlightlModelList(svg, _.keys(this.models));
      this.highlightModel(svg, this.selectedModelName);
    },
    highlightModel: function (svg, modelName) {
      svg.selectAll(`path.ranking-${modelName}`).style('stroke-width', this.s_ranking.HIGHLIGHT_RANKING_LINE_WIDTH);
      svg.selectAll(`line.ranking-${modelName}`).style('stroke-opacity', 1);
      svg.selectAll(`text.ranking-${modelName}`).style('fill', '#000000');
      svg.selectAll(`text.ranking-${modelName}`).style('font-weight', '900');
    },
    deHighlightModel: function (svg, modelName) {
      svg.selectAll(`path.ranking-${modelName}`).style('stroke-width', this.s_ranking.RANKING_LINE_WIDTH);
      svg.selectAll(`line.ranking-${modelName}`).style('stroke-opacity', 0);
      svg.selectAll(`text.ranking-${modelName}`).style('fill', '#555555');
      svg.selectAll(`text.ranking-${modelName}`).style('font-weight', '600');
    },
    deHighlightlModelList: function (svg, modelNames) {
      _.forEach(modelNames, modelName => this.deHighlightModel(svg, modelName));
    },
    /**
     * 퍼포먼스를 입력받아 랭킹 라인에 그릴 원의 반지름을 반환한다.   
     * 퍼포먼스는 0~100 사이의 값(확률 값)이다. 
     */
    getRadius: function (performance, maxR, minR, maxVal, minVal) {
      return (maxR - minR) * (performance - minVal) / (maxVal - minVal) + minR;
    },
    /**
     * 퍼포먼스를 입력받아 히트맵에 사용할 컬러를 반환한다.
     * 퍼포먼스는 0~100 사이의 값(확률 값)이다. 
     */
    getPerformanceColor: function (performance) {
      // 0.5(black) ~ 0.98(white)
      let rp = performance + 2;     // (0, 100) -> (2, 102)
      rp = rp > 100 ? 100 : rp;     // (2, 102) -> (2, 100)
      rp = (rp - 50) * 2;           // (2, 100) -> (-96, 100)
      rp = rp < 0 ? 0 : rp;         // (-96, 100) -> (0, 100) 
      const c = rp / 100 * 255;
      return `rgb(${c}, ${c}, ${c})`;
    },
    /*-------------------------------- R A N K I N G --------------------------------*/
    /*-------------------------------- C O N F U S I O N --------------------------------*/
    // TODO: 선택된 모델에대한 컨퓨전 매트릭스 그리기
    /*-------------------------------- C O N F U S I O N --------------------------------*/
  },
  watch: {
    selecteddata: async function (newdata) {
      console.log(`모델 예측 데이터 ${{ newdata }}가 로드되었습니다.`)
      this.models = await this.getModels(this.dataInfo[newdata].modelNames, newdata);
    },
    models: function (newModels) {
      VisUtil.removeSvg('ranking');
      this.visualizeRanking(newModels, this.selecteddata);
      this.selectedModelName = null;
    },
    selectedModelName: function (newModelName) {
      console.log(`모델 ${newModelName}이(가) 선택되었습니다.`)
      // TODO: updates confusion and projection.
      if (_.isNil(newModelName)) {
        // remove 
        return;
      } else {
        // update
      }
    }
  },
  async mounted () {
    // set model prediction result data
    this.selecteddata = this.dataNames[0]; // minst
  },
})
