const app = new Vue({
  el: '#app',

  data: {
    title: 'VisMLCV',
    sections: {
      ranking: {
        title: 'Ranking & Confusion Matrix',
        sorting_options: ['recall', 'presicion'],
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
        modelNames: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp'],
        modelNamesALL: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp', 'rfc_10', 'nn_10-layers'],
      }
    },

    // models for visualization 
    models: {},
    selectedModel: {},
    rankingCriteria: 'recall'
  },

  watch: {
    selecteddata: async function (newdata) {
      console.log(`모델 예측 데이터(${newdata})가 로드되었습니다.`)
      this.models = await this.getModels(
        this.dataInfo[newdata].modelNames,
        newdata
      );
    },
    models: function (newModels) {
      VisUtil.removeSvg('ranking');
      this.visualizeRanking(newModels, this.selecteddata);
      this.selectedModel = null;
    },
    selectedModel: function (newModel) {
      // TODO: updates confusion and projection.
      if (_.isNil(newModel)) {
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

    /**
     * 모델 예측 결과들을 입력 받아 랭킹을 시각화 한다. 
     * @param {*} models 
     */
    visualizeRanking: function (models, dataName) {
      // 필요한 함수는 vis.ranking에 만들어서 사용.
      console.log('=> 랭킹 시각화를 생성합니다. visualizeRanking()');
      console.log({ dataName, models });

      // Set data infomaition
      const classNames = this.dataInfo[dataName].classNames;
      const modelNames = _.keys(models);

      // Set svg root
      const root = d3.select('#vis-ranking');

      // Set width & height
      const WIDTH = 1504;
      const HEIGHT = 388;
      const LEFT_LEGEND_WIDTH = 120;
      const TOP_LEGEND_HEIGHT = 70;
      const RANKING_VIS_WIDHT = WIDTH - LEFT_LEGEND_WIDTH;
      const RANKING_VIS_HEIGHT = HEIGHT - TOP_LEGEND_HEIGHT;
      const NUM_OF_CELL = classNames.length + 1;  // Class Cells + An Accuracy Cell
      const CELL_WIDTH = RANKING_VIS_WIDHT / NUM_OF_CELL;
      const CELL_HEIGHT = RANKING_VIS_HEIGHT / modelNames.length;
      const RANKING_LINE_WIDTH = CELL_HEIGHT * 0.3;

      // Draw legend
      VisUtil.text(root, 'Actual Classes',
        { x: WIDTH / 2, fill: '#333', size: '24px', baseline: 'hanging' });

      // => Draw class legend (Top)
      const columnLegends = ['Accuracy', ...classNames];
      _.forEach(columnLegends, (text, i) => {
        const x = LEFT_LEGEND_WIDTH + i * CELL_WIDTH + CELL_WIDTH / 2;
        const y = TOP_LEGEND_HEIGHT - 5;
        VisUtil.text(root, text, { x, y, baseline: 'ideographic' });
      });

      // => Draw model legend (Left)
      _.forEach(modelNames, (modelName, i) => {
        const y = TOP_LEGEND_HEIGHT + i * CELL_HEIGHT;
        if (i % 2 === 0) {
          VisUtil.rect(root, { y: y, w: WIDTH, h: CELL_HEIGHT, fill: '#f3f3f3' });
        }
        const y_text = y + CELL_HEIGHT / 2;
        VisUtil.text(root, modelName, { x: 20, y: y_text, anchor: 'start' });
      });

      // Get Ranking Info.
      const rankingByClass = VisRanking.getRankingBy(models, this.rankingCriteria, classNames);

      // Visualize Ranking Info.
      _.forEach(modelNames, (modelName, yi) => {
        const modelColor = Constants.colors[modelName];
        let x = LEFT_LEGEND_WIDTH;
        let y = TOP_LEGEND_HEIGHT + yi * CELL_HEIGHT + CELL_HEIGHT / 2; // for accuracy
        let performance = Math.floor(models[modelName].performance.accuracy * 100);
        let r = VisRanking.getRadius(performance, CELL_HEIGHT / 2, 10, 100, 80);
        let heatRgb = VisRanking.getPerformanceColor(performance);
        console.log(heatRgb)

        VisUtil.circle(root, { x: x + CELL_WIDTH / 2, y, r, stroke: modelColor, fill: heatRgb });
        VisUtil.text(root, performance, { x: x + CELL_WIDTH / 2, y });
        let pathData = [
          { x: LEFT_LEGEND_WIDTH + CELL_WIDTH * 0.5, y },
          { x: LEFT_LEGEND_WIDTH + CELL_WIDTH * 0.8, y }
        ];

        _.forEach(classNames, (className, xi) => {
          const rank = rankingByClass[className].indexOf(modelName);
          performance = Math.floor(models[modelName].performance[this.rankingCriteria][className] * 100);
          x = LEFT_LEGEND_WIDTH + (xi + 1) * CELL_WIDTH;
          y = TOP_LEGEND_HEIGHT + rank * CELL_HEIGHT + CELL_HEIGHT / 2;
          r = VisRanking.getRadius(performance, CELL_HEIGHT / 2, 10, 100, 80);
          heatRgb = VisRanking.getPerformanceColor(performance);
          VisUtil.circle(root, { x: x + CELL_WIDTH / 2, y, r, stroke: modelColor, fill: heatRgb })
          VisUtil.text(root, performance, { x: x + CELL_WIDTH / 2, y })
          pathData = [
            ...pathData,
            { x: x + CELL_WIDTH * 0.2, y },
            { x: x + CELL_WIDTH * 0.8, y }
          ];
        });
        VisUtil.path(root, pathData, { stroke: modelColor, width: RANKING_LINE_WIDTH })
      });

      // TODO: 랭킹라인 하이라이트 기능 개발 

      VisUtil.sortSvgObjs(root);
    }
  },

  async mounted() {
    // set model prediction result data
    this.selecteddata = this.dataNames[0]; // minst
  },
})
