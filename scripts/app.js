const app = new Vue({
  el: '#app',

  data: {
    title: 'VisMLCV',
    svg: {
      ranking: d3.select('#vis-ranking'),
      confusion: d3.select('#vis-confusion'),
      projection: d3.select('#vis-projection'),
      instances: d3.select('#vis-instances'),
    },
    sections: {
      ranking: {
        title: 'Ranking',
        sort_options: ['recall', 'presicion'],
      },
      confusion: {
        title: 'Confusion Matrix'
      },
      projection: {
        title: '2D Projection'
      },
      instances: {
        title: 'Instance Analysis'
      },
    },
    datasetNames: ['mnist'],
    mnistModels: ['cnn', 'rfc_50', 'nn_3-layers', 'nn_5-layers', 'rfc_25', 'slp', 'rfc_10', 'nn_10-layers'],
    models: {},
    selectedModel: {},
  },

  watch: {
    models: function (newModels) {
      this.visualizeRanking(newModels);
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
     * @param {*} datasetName 
     */
    getModels: async function (modelNames, datasetName) {
      const models = {};
      for (let modelName of modelNames) {
        models[modelName] = await this.getModel(modelName, datasetName);
      }
      return models;
    },

    /**
     * 모델 이름 하나와 데이터 셋 이름을 입력받아 해당 모델의 예측 결과를 반환한다.
     * @param {*} modelName 
     * @param {*} datasetName
     */
    getModel: async function (modelName, datasetName) {
      const dirname = `../data/${datasetName}/result/`;
      const filename = `${datasetName}_${modelName}__result.json`;
      const response = await fetch(dirname + filename);
      return await response.json();
    },

    /**
     * 모델 예측 결과들을 입력 받아 랭킹을 시각화 한다. 
     * @param {*} models 
     */
    visualizeRanking: function (models) {
      // TODO: 랭킹 시각화 하기 
      console.log('=> 랭킹 시각화를 생성합니다. visualizeRanking()');
      console.log(models);

      // Width & Height
      const WIDTH = 1488;
      const HEIGHT = 352;
      const LEGEND_ZONE_WIDTH = 240;
      const LEGEND_ZONE_HEIGHT = 70;
      const RANKING_VIS_WIDHT = WIDTH - LEGEND_ZONE_WIDTH;
      const RANKING_VIS_HEIGHT = HEIGHT - LEGEND_ZONE_HEIGHT;
    }
  },

  async mounted () {
    // set model prediction result data
    console.log("모델 예측 데이터(mnist)가 로드되었습니다.")
    this.models = await this.getModels(this.mnistModels, this.datasetNames[0]);
  },
})
