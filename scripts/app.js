const app = new Vue({
  el: '#app',

  data: {
    title: 'VisMLCV',
    sections: {
      ranking: {
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
      confusion: {
        title: ''
      },
      projection: {
        title: '2D Projection'
      },
      instances: {
        title: 'Instances'
      },
    },

    // dataset
    selecteddata: '',
    dataNames: ['mnist'],
    dataInfo: {
      mnist: {
        classNames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        modelNames: ['rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp'],
        modelNamesALL: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp', 'rfc_10', 'nn_10-layers'],
      }
    },

    // models for visualization 
    models: {},
    selectedModelName: '',
    rankingCriteria: 'recall'
  },

  watch: {
    selecteddata: async function (newdata) {
      console.log(`모델 예측 데이터(${newdata})가 로드되었습니다.`)
      this.models = await this.getModels(this.dataInfo[newdata].modelNames, newdata);
    },
    models: function (newModels) {
      VisUtil.removeSvg('ranking');
      this.visualizeRanking(newModels, this.selecteddata);
      this.selectedModelName = null;
    },
    selectedModelName: function (newModelName) {
      // TODO: updates confusion and projection.
      if (_.isNil(newModelName)) {
        // remove 
        return;
      } else {
        // update
      }
    }
  },

  methods: {
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

    /*-------------------------------- R A N K I N G --------------------------------*/
    /**
     * 모델 예측 결과들을 입력 받아 랭킹을 시각화 한다. 
     * @param {*} models 
     */
    visualizeRanking: function (models, dataName) {
      console.log(`=> 랭킹 시각화를 생성합니다. visualizeRanking(${{ dataName, models }})`);
      // Set data infomaition
      const classNames = this.dataInfo[dataName].classNames;
      const modelNames = _.keys(models);
      // Set size of visual elements
      this.setRankingSectionSize(modelNames, classNames);
      // Set svg root
      const root = d3.select('#vis-ranking');

      // Draw legend
      this.drawRakingLegendTop(root, classNames);
      this.drawRakingLegendLeft(root, modelNames);

      // Get ranking Info.
      const rankingByClass = this.getRankingBy(models, this.rankingCriteria, classNames);
      // Visualize ranking Info.
      this.drawRankingLines(root, rankingByClass, models, classNames);

      // Sort visual elements
      VisUtil.sortSvgObjs(root, ['circle', 'text']);

      // Add event listners
      this.addEventRanking(modelNames);
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

    drawRakingLegendTop: function (svg, classNames) {
      VisUtil.text(svg, 'Actual Classes',
        { x: this.sections.ranking.WIDTH / 2, fill: '#333', size: '24px', baseline: 'hanging' });
      const columnLegends = ['Accuracy', ...classNames];
      _.forEach(columnLegends, (text, i) => {
        const x = this.sections.ranking.LEFT_LEGEND_WIDTH + i * this.sections.ranking.CELL_WIDTH + this.sections.ranking.CELL_WIDTH / 2;
        const y = this.sections.ranking.TOP_LEGEND_HEIGHT - 5;
        VisUtil.text(svg, text, { x, y, baseline: 'ideographic' });
      });
    },

    drawRakingLegendLeft: function (svg, modelNames) {
      _.forEach(modelNames, (modelName, i) => {
        const y = this.sections.ranking.TOP_LEGEND_HEIGHT + i * this.sections.ranking.CELL_HEIGHT;
        const background = (i % 2 === 0) ? '#f3f3f3' : '#ffffff';
        VisUtil.rect(svg, { y: y, w: this.sections.ranking.WIDTH, h: this.sections.ranking.CELL_HEIGHT, fill: background });
        // for higlighting
        VisUtil.rect(svg, {
          y: y + (this.sections.ranking.CELL_HEIGHT - 30) / 2,
          w: this.sections.ranking.LEFT_LEGEND_WIDTH,
          h: 30,
          fill: background,
          class: `ranking-${modelName}`
        });
        const y_text = y + this.sections.ranking.CELL_HEIGHT / 2;
        VisUtil.text(svg, modelName, {
          x: 20, y: y_text, anchor: 'start', class: `ranking-${modelName}`
        });
      });
    },

    setRankingSectionSize: function (modelNames, classNames) {
      this.sections.ranking.NUM_OF_COLUMNS = classNames.length + 1;  // Class Cells + An Accuracy Cell
      this.sections.ranking.CELL_WIDTH = this.sections.ranking.RANKING_VIS_WIDHT / this.sections.ranking.NUM_OF_COLUMNS;
      this.sections.ranking.CELL_HEIGHT = this.sections.ranking.RANKING_VIS_HEIGHT / modelNames.length;
      this.sections.ranking.RANKING_LINE_WIDTH = this.sections.ranking.CELL_HEIGHT * 0.3;
      this.sections.ranking.HIGHLIGHT_RANKING_LINE_WIDTH = this.sections.ranking.CELL_HEIGHT * 0.7;
    },

    drawRankingLines: function (svg, rankingByClass, models, classNames) {
      const modelNames = _.keys(models);
      _.forEach(modelNames, (modelName, yi) => {
        const modelColor = Constants.colors[modelName];
        let x = this.sections.ranking.LEFT_LEGEND_WIDTH;
        let y = this.sections.ranking.TOP_LEGEND_HEIGHT + yi * this.sections.ranking.CELL_HEIGHT + this.sections.ranking.CELL_HEIGHT / 2; // for accuracy
        let performance = Math.floor(models[modelName].performance.accuracy * 100);
        let r = VisRanking.getRadius(performance, this.sections.ranking.CELL_HEIGHT / 2, 10, 100, 80);
        let heatRgb = VisRanking.getPerformanceColor(performance);

        // Whole Accuracy
        VisUtil.circle(svg, {
          x: x + this.sections.ranking.CELL_WIDTH / 2,
          y: y,
          r,
          stroke: modelColor,
          fill: heatRgb,
          class: `ranking- ${modelName}`
        });
        VisUtil.text(svg, performance, { x: x + this.sections.ranking.CELL_WIDTH / 2, y });
        VisUtil.line(svg, {
          x1: 0,
          x2: this.sections.ranking.LEFT_LEGEND_WIDTH + this.sections.ranking.CELL_WIDTH / 2,
          y1: y,
          y2: y,
          stroke: Constants.colors[modelName],
          opacity: 0,
          width: this.sections.ranking.HIGHLIGHT_RANKING_LINE_WIDTH,
          class: `ranking-${modelName}`
        })
        let pathData = [
          { x: this.sections.ranking.LEFT_LEGEND_WIDTH + this.sections.ranking.CELL_WIDTH * 0.5, y },
          { x: this.sections.ranking.LEFT_LEGEND_WIDTH + this.sections.ranking.CELL_WIDTH * 0.8, y }
        ];

        // Recalls or Precisions of each classes
        _.forEach(classNames, (className, xi) => {
          const rank = rankingByClass[className].indexOf(modelName);
          performance = Math.floor(models[modelName].performance[this.rankingCriteria][className] * 100);
          x = this.sections.ranking.LEFT_LEGEND_WIDTH + (xi + 1) * this.sections.ranking.CELL_WIDTH;
          y = this.sections.ranking.TOP_LEGEND_HEIGHT + rank * this.sections.ranking.CELL_HEIGHT + this.sections.ranking.CELL_HEIGHT / 2;
          r = VisRanking.getRadius(performance, this.sections.ranking.CELL_HEIGHT / 2, 10, 100, 80);
          heatRgb = VisRanking.getPerformanceColor(performance);
          VisUtil.circle(svg, {
            x: x + this.sections.ranking.CELL_WIDTH / 2, y, r, stroke: modelColor, fill: heatRgb, class: `ranking-${modelName}`
          })
          VisUtil.text(svg, performance, {
            x: x + this.sections.ranking.CELL_WIDTH / 2, y, class: `ranking-${modelName}`
          })
          pathData = [
            ...pathData,
            { x: x + this.sections.ranking.CELL_WIDTH * 0.2, y },
            { x: x + this.sections.ranking.CELL_WIDTH * 0.8, y }
          ];
        });
        VisUtil.path(svg, pathData, {
          stroke: modelColor,
          width: this.sections.ranking.RANKING_LINE_WIDTH,
          class: `ranking-${modelName}`
        });
      });
    },

    // Evnets for visual elements in ranking section.
    addEventRanking: function (modelNames) {
      _.forEach(modelNames, (modelName) => {
        d3.selectAll(`.ranking-${modelName}`)
          .on('mouseover', () => this.mouseOverRanking(root, modelName))
          .on('mouseout', () => this.mouseOutRanking(root, modelName))
          .on('mousedown', () => this.mouseDownRanking(root, modelName));
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
      // TODO: 컨퓨전 매트릭스 업데이트
    },
    highlightModel: function (svg, modelName) {
      svg.selectAll(`path.ranking-${modelName}`).style('stroke-width', this.sections.ranking.HIGHLIGHT_RANKING_LINE_WIDTH);
      svg.selectAll(`line.ranking-${modelName}`).style('stroke-opacity', 1);
      svg.selectAll(`text.ranking-${modelName}`).style('fill', '#000000');
      svg.selectAll(`text.ranking-${modelName}`).style('font-weight', '900');
    },
    deHighlightModel: function (svg, modelName) {
      svg.selectAll(`path.ranking-${modelName}`).style('stroke-width', this.sections.ranking.RANKING_LINE_WIDTH);
      svg.selectAll(`line.ranking-${modelName}`).style('stroke-opacity', 0);
      svg.selectAll(`text.ranking-${modelName}`).style('fill', '#555555');
      svg.selectAll(`text.ranking-${modelName}`).style('font-weight', '600');
    },
    deHighlightlModelList: function (svg, modelNames) {
      _.forEach(modelNames, modelName => this.deHighlightModel(svg, modelName));
    }
    /*-------------------------------- R A N K I N G --------------------------------*/
  },

  async mounted () {
    // set model prediction result data
    this.selecteddata = this.dataNames[0]; // minst
  },
})
