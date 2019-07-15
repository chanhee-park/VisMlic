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
      title: 'Confusion Matrix',
      WIDTH: 1504,
      HEIGHT: 959,
      LEFT_LEGEND_WIDTH: 120,
      TOP_LEGEND_HEIGHT: 0,
      CONFUSION_VIS_WIDHT: 1504 - 120,  // WIDTH - LEFT_LEGEND_WIDTH,
      CONFUSION_VIS_HEIGHT: 959 - 0,    // HEIGHT - TOP_LEGEND_HEIGHT,
      NUM_OF_COLUMNS: null,           // Set when data is loaded.
      CELL_WIDTH: null,
      CELL_HEIGHT: null,
      IAMGE_WIDTH: null,
      IMAGE_HEIGHT: null,
    },
    s_projection: {
      title: '2D Projection'
    },
    s_instances: {
      title: 'Instances',
      filenames: [],
    },
    // app.data -> dataset
    selectedData: '',
    selectedModelName: '',
    selectedConfuion: {
      real: null,
      pred: null,
    },
    dataNames: ['mnist'],
    dataInfo: {
      mnist: {
        classNames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        modelNames: ['rfc_50', 'nn_5-layers', 'nn_3-layers', 'rfc_25', 'slp'],
        modelNamesALL: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp', 'rfc_10', 'nn_10-layers'],
      }
    },
    // app.data -> models for visualization
    models: {},
    rankingCriteria: 'recall',
    // app.data -> visual element's features
    font_size: {
      default: '24px'
    },
    colors: {
      'cnn': '#FD8D3C',
      'nn_10-layers': '#3182BD',
      'nn_5-layers': '#6BAED6',
      'nn_3-layers': '#9ECAE1',
      'slp': '#9E9AC8',
      'rfc_50': '#30A354',
      'rfc_25': '#74C476',
      'rfc_10': '#A0D99B',
      confusion_red: function (d) {
        // d is between 0.0 ~ 1.0 (대부분 0.05 이하)
        return `rgb(255, 70, 70, ${d * 10})`
        // return d3.interpolateReds(d); // [0, 1]
      },
    },
  },
  methods: {
    /*------------------------------------- D A T A -------------------------------------*/
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
      const dirname = `./data/${dataName}/result/`;
      const filename = `${dataName}_${modelName}__result.json`;
      const response = await fetch(dirname + filename);
      return await response.json();
    },

    getImageFilename: function (dataName, classname, index) {
      return `./data/${dataName}/images/${classname}/${classname}_${index + 1}.png`;
    },
    /*------------------------------------- D A T A -------------------------------------*/
    /*-----------------------------------------------------------------------------------*/
    /*---------------------------------- R A N K I N G ----------------------------------*/
    /**
     * 모델 예측 결과들을 입력 받아 랭킹을 시각화 한다. 
     * @param {*} models 
     */
    visualizeRanking: function (svg, models, dataName, criteria) {
      // Set data infomaition
      const classNames = this.dataInfo[dataName].classNames;
      const modelNames = _.keys(models);

      // Get ranking infomation & Draw ranking lines
      const rankingInfo = this.getRankingBy(models, criteria, classNames);
      this.drawRankingLines(svg, rankingInfo, models, classNames);

      // Sort visual elements
      VisUtil.sortSvgObjs(svg, ['circle', 'text']);

      // Add event listners
      this.addEventRanking(svg, modelNames);
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
        const sorted = _.sortBy(classPerformance, ['performance', 'accuracy', 'modelName']);
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
        const x = this.s_ranking.LEFT_LEGEND_WIDTH +
          i * this.s_ranking.CELL_WIDTH +
          this.s_ranking.CELL_WIDTH / 2;
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
    setLeftSectionSize: function (modelNames, classNames) {
      this.s_ranking.NUM_OF_COLUMNS = classNames.length + 1;  // Class Cells + An Accuracy Cell
      this.s_ranking.CELL_WIDTH = this.s_ranking.RANKING_VIS_WIDHT / this.s_ranking.NUM_OF_COLUMNS;
      this.s_ranking.CELL_HEIGHT = this.s_ranking.RANKING_VIS_HEIGHT / modelNames.length;
      this.s_ranking.RANKING_LINE_WIDTH = this.s_ranking.CELL_HEIGHT * 0.25;
      this.s_ranking.HIGHLIGHT_RANKING_LINE_WIDTH = this.s_ranking.CELL_HEIGHT * 0.75;

      this.s_confusion.NUM_OF_COLUMNS = classNames.length;
      this.s_confusion.CELL_WIDTH = this.s_ranking.CELL_WIDTH;
      this.s_confusion.CELL_HEIGHT = this.s_confusion.CONFUSION_VIS_HEIGHT / classNames.length;
      this.s_confusion.IAMGE_WIDTH = this.s_ranking.CELL_WIDTH * 0.5;
      this.s_confusion.IMAGE_HEIGHT = this.s_ranking.CELL_WIDTH * 0.5;
    },
    // draw ranking lines 
    drawRankingLines: function (svg, rankingByClass, models, classNames) {
      const modelNames = _.keys(models);
      _.forEach(modelNames, (modelName, yi) => {
        const modelColor = this.colors[modelName];
        let x = this.s_ranking.LEFT_LEGEND_WIDTH;
        let y = this.s_ranking.TOP_LEGEND_HEIGHT +
          yi * this.s_ranking.CELL_HEIGHT +
          this.s_ranking.CELL_HEIGHT / 2; // for accuracy
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
          stroke: this.colors[modelName],
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
          y = this.s_ranking.TOP_LEGEND_HEIGHT +
            rank * this.s_ranking.CELL_HEIGHT +
            this.s_ranking.CELL_HEIGHT / 2;
          r = this.getRadius(performance, this.s_ranking.CELL_HEIGHT / 2, 10, 100, 80);
          heatRgb = this.getPerformanceColor(performance);
          VisUtil.circle(svg, {
            x: x + this.s_ranking.CELL_WIDTH / 2,
            y,
            r,
            stroke: modelColor,
            fill: heatRgb,
            class: `ranking-${modelName}`
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
      svg.selectAll(`path.ranking-${modelName}`)
        .style('stroke-width', this.s_ranking.HIGHLIGHT_RANKING_LINE_WIDTH);
      svg.selectAll(`line.ranking-${modelName}`).style('stroke-opacity', 1);
      svg.selectAll(`text.ranking-${modelName}`).style('fill', '#000000');
      svg.selectAll(`text.ranking-${modelName}`).style('font-weight', '900');
    },
    deHighlightModel: function (svg, modelName) {
      svg.selectAll(`path.ranking-${modelName}`)
        .style('stroke-width', this.s_ranking.RANKING_LINE_WIDTH);
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
    /*---------------------------------- R A N K I N G ----------------------------------*/
    /*-----------------------------------------------------------------------------------*/
    /*-------------------------------- C O N F U S I O N --------------------------------*/
    visualizeConfusion: function (svg, modelName, dataName) {
      // Set data infomaition
      const classNames = this.dataInfo[dataName].classNames;
      const predictResult = this.models[modelName].predict;

      // Empty svg & Draw axis
      VisUtil.emptySvg('#vis-confusion');
      this.drawConfusionLegend(svg, classNames);
      this.drawConfusionAxis(svg, classNames);

      // Get confusion infomation & Draw it.
      const confusionInfo = this.getConfusionBy(predictResult, classNames);
      const repImageIdxs = this.getRepImageIdxs(predictResult, classNames);
      this.drawConfusionMatrix(svg, confusionInfo);
      this.drawConfusionRepImages(svg, dataName, repImageIdxs);

      // Sort visual elements
      VisUtil.sortSvgObjs(svg, ['image', 'rect', 'line', 'text']);
      this.addEventConfusion(svg, classNames);           // Add event listners
    },
    // draw legend for confucion matrix
    drawConfusionLegend: function (svg, classNames) {
      const l_legend_w = this.s_confusion.LEFT_LEGEND_WIDTH;
      const whole_h = this.s_confusion.HEIGHT;
      const cell_h = this.s_confusion.CELL_HEIGHT;
      const cell_w = this.s_confusion.CELL_WIDTH;
      VisUtil.text(svg, 'Predicted Classes',
        { x: l_legend_w / 2, y: whole_h / 2, fill: '#333', size: '24px', 'writing-mode': 'tb', });
      _.forEach(classNames, (className, row) => {
        VisUtil.text(svg, className, {
          x: l_legend_w + cell_w / 2,
          y: row * cell_h + cell_h / 2,
        })
      });
    },
    // draw axis for confusion matrix
    drawConfusionAxis: function (svg, classNames) {
      const total_h = this.s_confusion.HEIGHT;
      const total_w = this.s_confusion.WIDTH;
      const l_legend_w = this.s_confusion.LEFT_LEGEND_WIDTH;
      const cell_w = this.s_confusion.CELL_WIDTH;
      const cell_h = this.s_confusion.CELL_HEIGHT;
      _.forEach(classNames, (className, idx) => {
        const col_x = l_legend_w + cell_w + idx * cell_w;
        const row_y = idx * cell_h;
        VisUtil.line(svg, { x1: l_legend_w + cell_w, x2: total_w, y1: row_y, y2: row_y }); // 가로줄
        VisUtil.line(svg, { x1: col_x, x2: col_x, y1: 0, y2: total_h });
      });
    },
    // get image index matrix of confusion
    getConfusionBy: function (preds, classNames) {
      const numOfClassElem = preds.length / classNames.length;
      const matrix = this.getEmptyMatrix(classNames);
      _.forEach(preds, (pred) => {
        matrix[pred.real][pred.pred] += 1 / numOfClassElem;
      });
      return matrix;
    },
    // get empty marix object (that has keys of classname for colunms and rows)
    getEmptyMatrix: function (classNames) {
      const matrix = {};
      _.forEach(classNames, (real) => {
        matrix[real] = {};
        _.forEach(classNames, (pred) => {
          matrix[real][pred] = 0;
        });
      });
      return matrix;
    },
    // draw heatmap (confusion matrix) with draw confusion matrix with misclassified ratio
    drawConfusionMatrix: function (svg, confusonMatrix) {
      const classNames = _.keys(confusonMatrix);
      const classLen = classNames.length;
      const w = this.s_confusion.CELL_WIDTH;
      const h = this.s_confusion.CELL_HEIGHT;
      const x_start = this.s_confusion.LEFT_LEGEND_WIDTH + w;
      for (let real = 0; real < classLen; real++) {
        const x = x_start + real * w;
        for (let pred = 0; pred < classLen; pred++) {
          const y = pred * h;
          const val = Math.floor(confusonMatrix[real][pred] * 1000) / 1000;
          const color = (real === pred) ? 'rgb(255, 255, 255, 0)' : this.colors.confusion_red(val);
          VisUtil.rect(svg, { x, y, w, h, fill: color, st_width: '1px', class: `confusion-${real}-${pred}` });
          // VisUtil.text(svg, val, { x: x + w / 2, y: y + h / 2 });
        }
      }
    },
    // get index array of representitive misclassified instances
    getRepImageIdxs: function (modelPreds, classNames) {
      const matrix = this.getEmptyMatrix(classNames);
      _.forEach(classNames, (real) => {
        const realFiltered = _.filter(modelPreds, p => p.real === real);
        const classInstancesSize = realFiltered.length;
        _.forEach(classNames, (pred) => {
          const filtered = _.filter(realFiltered, p => p['pred'] === pred);
          const sorted = _.sortBy(filtered, p => - p['pred_proba'][pred]);
          const repImage = sorted[0];
          const maxInstanceIdx = (modelPreds.indexOf(repImage)) % classInstancesSize;
          matrix[real][pred] = maxInstanceIdx;
        });
      });
      return matrix;
    },
    // draw instances (confusion matrix) with representitive misclassified image
    drawConfusionRepImages: function (svg, dataName, repImageMatrix) {
      const classNames = _.keys(repImageMatrix);
      const classLen = classNames.length;
      const w = this.s_confusion.CELL_WIDTH;
      const h = this.s_confusion.CELL_HEIGHT;
      const im_w = this.s_confusion.IAMGE_WIDTH;
      const im_h = this.s_confusion.IMAGE_HEIGHT;
      const x_start = this.s_confusion.LEFT_LEGEND_WIDTH + w;

      for (let real = 0; real < classLen; real++) {
        const x = x_start + real * w;
        for (let pred = 0; pred < classLen; pred++) {
          if (real === pred) continue;
          const repIdx = repImageMatrix[real][pred];
          if (_.isNil(repIdx) || repIdx < 0) continue;
          const y = pred * h;
          const file = this.getImageFilename(dataName, real, repIdx);
          VisUtil.image(svg, file, {
            x: x + (w - im_w) / 2,
            y: y + (h - im_h) / 2,
            w: im_w,
            h: im_h,
          });
        }
      }
    },
    // Evnets for visual elements in ranking section.
    addEventConfusion: function (svg, classNames) {
      for (let real of classNames) {
        for (let pred of classNames) {
          if (real === pred) continue;
          const selector = `rect.confusion-${real}-${pred}`;
          svg.selectAll(selector)
            .on('mousedown', () => this.mouseDownConfusion(svg, real, pred));
        }
      }
    },
    mouseDownConfusion: function (svg, realClass, predClass) {
      this.deHighlightAllConfusionCells(svg);
      this.highlightConfusionCell(svg, realClass, predClass);
      this.selectedConfuion = {
        real: realClass,
        pred: predClass
      }
    },
    highlightConfusionCell: function (svg, realClass, predClass) {
      svg.selectAll(`rect.confusion-${realClass}-${predClass}`)
        .style('stroke-width', '5px')
        .style('stroke', '#000');
    },
    deHighlightAllConfusionCells: function (svg) {
      svg.selectAll('rect')
        .style('stroke-width', '1px')
        .style('stroke', '#ccc');
    },
    /*-------------------------------- C O N F U S I O N --------------------------------*/
    /*-----------------------------------------------------------------------------------*/
    /*----------------------------- 2 D - P R O J E C T I O N----------------------------*/
    // TODO:  모델 재 개발 및 t-SNE 맵 시각화 개발
    /*----------------------------- 2 D - P R O J E C T I O N----------------------------*/
    /*-----------------------------------------------------------------------------------*/
    /*-------------------------------- I N S T A N C E S --------------------------------*/
    visualizeInstances: function (dataName, modelName, real, pred) {
      const modelPreds = this.models[modelName].predict;
      // get & set filenames by condition
      const imgIdxs = this.getMisInstanceIdxs(modelPreds, real, pred);
      this.s_instances.filenames = this.getFilenamesFromIdsx(dataName, real, imgIdxs);
    },
    // get index of misclassified instances by condition
    getMisInstanceIdxs: function (modelPreds, realClass, predClass) {
      const realConditioned = _.filter(modelPreds, (pred) => pred.real === realClass);
      const classInstancesSize = realConditioned.length;
      const conditioned = _.filter(realConditioned, (pred) => pred.pred === predClass);
      const sorted = _.sortBy(conditioned, (pred) => - pred.pred_proba[predClass]);
      const indexs = _.map(sorted, (p) => modelPreds.indexOf(p) % classInstancesSize);
      return indexs;
    },
    getFilenamesFromIdsx: function (dataName, real, imgIdxs) {
      const filenames = _.map(imgIdxs, (imgIdx) => {
        return this.getImageFilename(dataName, real, imgIdx);
      });
      return filenames;
    },
    /*-------------------------------- I N S T A N C E S --------------------------------*/
  },
  watch: {
    selectedData: async function (newdata) {
      this.models = await this.getModels(this.dataInfo[newdata].modelNames, newdata);
      // Update Other Data
      this.selectedModelName = null;
      this.selectedConfuion = { real: null, pred: null };
    },
    models: function (newModels) {
      if (_.isNil(this.selectedData) || _.isNil(newModels)) return;
      // Set & empty svg
      const rankingSvg = d3.select('#vis-ranking');
      const confusionSvg = d3.select('#vis-confusion');
      VisUtil.emptySvg('#vis-ranking');
      VisUtil.emptySvg('#vis-confusion');

      // Set data infomaition
      const dataName = this.selectedData;
      const classNames = this.dataInfo[dataName].classNames;
      const modelNames = _.keys(newModels);

      // Set size of visual elements
      this.setLeftSectionSize(modelNames, classNames);

      // Draw Legends & Axis
      this.drawRakingLegendTop(rankingSvg, classNames);
      this.drawRakingLegendLeft(rankingSvg, modelNames);
      this.drawConfusionLegend(confusionSvg, classNames);
      this.drawConfusionAxis(confusionSvg, classNames);

      // Visualize
      this.visualizeRanking(rankingSvg, newModels, dataName, this.rankingCriteria);

      // Update Other Data
      this.selectedModelName = null;
      this.selectedConfuion = { real: null, pred: null };
    },
    selectedModelName: function (newModelName) {
      if (_.isNil(newModelName)) return;
      // Visualize
      const confusionSvg = d3.select('#vis-confusion');
      const dataName = this.selectedData;
      this.visualizeConfusion(confusionSvg, newModelName, dataName);

      // Update Other Data
      this.selectedConfuion = { real: null, pred: null };
    },
    selectedConfuion: function (newConfusion) {
      if (_.isNil(newConfusion.real) || _.isNil(newConfusion.pred)) {
        this.s_instances.filenames = [];
        return;
      }
      const dataName = this.selectedData;
      const modelName = this.selectedModelName;
      const real = newConfusion.real;
      const pred = newConfusion.pred;
      this.visualizeInstances(dataName, modelName, real, pred);
    }
  },
  async mounted () {
    // set dataName
    this.selectedData = this.dataNames[0]; // minst
  },
})
