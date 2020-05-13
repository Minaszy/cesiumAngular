import { Component, TemplateRef, OnInit, ViewChild } from '@angular/core';
import turf from 'turf';
import { ApiService } from '../../service/api.service';
import { config } from '../../config';
declare const Cesium;
@Component({
  selector: 'app-layout-page',
  templateUrl: './layout-page.component.html',
  styleUrls: ['./layout-page.component.css']
})
export class LayoutPageComponent implements OnInit {
  text: any = 'admin';
  isCollapsed = false;
  viewer: any;
  baseMap: any;
  patrolName: any = '蚂蚁浜';
  triggerTemplate: TemplateRef<void> | null = null;
  panel = {
    active: false,
    name: '河道基础信息',
    childPanel: [
      {
        active: false,
        name: 'This is panel header 1-1'
      }
    ]
  };
  riverInfo = [];
  mybInfo = [['河道名称', '水体编码', '管理等级', '一级河长', '二级河长'], ['蚂蚁浜', 'JA8', '区管', '李震', '司静']];
  wzbInfo = [['河道名称', '水体编码', '管理等级', '一级河长', '二级河长'], ['蕰藻浜', 'JD117', '市管', '范少军', '陆方舟']];
  waterCleanData: any = [];
  landCleanData: any = [];
  riverAboutData: any = [];
  waterFaceData: any;
  underWaterShape: any;
  underWaterSource: any;
  pointJson: any;
  flagTimer: any;
  TPModel: any;
  TPModelClass: any;
  infodata: any;
  @ViewChild('trigger') customTrigger: TemplateRef<void>;
  constructor(private apiService: ApiService) { }

  changeTrigger(): void {
    console.log(1);
    this.triggerTemplate = this.customTrigger;
  }

  ngOnInit() {
    console.log(Cesium);
    this.initCesium();
    // this.addWaterFace();
    this.addUnderWaterShape();
  }


  initCesium() {
    Cesium.Ion.defaultAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4NjE5ZTIzYy0zN2JkLTRjNzEtYmQ5NC02NjMzZjI0MWRhOTUiLCJpZCI6MjU5LCJzY29wZXMiOlsiYXNyIiwiZ2MiXSwiaWF0IjoxNTY5OTM5MjkyfQ.JBBkmCCcbd4De9AawCQStH0IzQXIimYn0wmhZ4YD2Ts';
    // 添加底图——谷歌影像
    const googleLayer = new Cesium.UrlTemplateImageryProvider({
      url: config.mapConfig.google,
      tilingScheme: new Cesium.WebMercatorTilingScheme()
    });

    this.viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      fullscreenButton: false,
      timeline: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      infoBox: false,
      homeButton: false,
      scene3DOnly: false,
      sceneModePicker: false,
      cesiumLogo: false,
      vrButton: false,
      imageryProvider: googleLayer
    });

    this.viewer._cesiumWidget._creditContainer.style.display = 'none';
    // this.viewer.imageryLayers.remove(this.viewer.imageryLayers.get(0));
    // 开启光照效果
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.shadows = true;
    // 增加谷歌影像底图
    this.baseMap = this.viewer.imageryLayers.addImageryProvider(googleLayer);
    // console.log(this.viewer.imageryLayers.length);
    this.addRiverDom();

    // viewer.terrainProvider = Cesium.createWorldTerrain();
    // 打开深度检测，那么在地形以下的对象不可见
    // this.viewer.scene.globe.depthTestAgainstTerrain = false;
    // viewer.scene.globe.showGroundAtmosphere = false;
    /**完美倾斜效果方法的思路：
     * 根据extent[121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095]可以确定相机视角与地面的交点A，默认相机朝向并使用extent作为相机视域的情况下，会根据相机参数计算得到一个合适的高度h，将相机放在这个高度上，并朝向extent的中心点A。这种情况地面与屏幕是平行的，没有倾斜角度。在这种情况下，将地面倾斜到一定角度，相机的位置要往屏幕中心点的下方移动（新的点位B），与此同时，相机的高度会变小（h1），原来高度h将会A、B、h1的斜边。此时根据倾斜角、h（还有一个直角）可以计算出高度h1和AB两点的距离，再根据A坐标和AB的距离，可以计算出B点的坐标；
     */
    setTimeout(() => {
      this.flytoShangHai();

      this.addWaterPro();
      this.addPatrolPro();
    }, 3000);
    setTimeout(() => {
      this.flytoMayibang();
    }, 7000);

    this.addRedLine();
    this.addBuildings();
    this.addBuildings1();
    this.addTPModel();
    // 添加海永镇倾斜摄影数据
    this.addHY();
    this.addEvt();

  }

  addHY() {

    const imagetile = new Cesium.Cesium3DTileset({ url: "/api/Scene/tiles.json" });
    this.TPModel = this.viewer.scene.primitives.add(imagetile);
    this.TPModel.readyPromise.then(() => {
      const boundingSphere = this.TPModel.boundingSphere;
      this.viewer.scene.camera.viewBoundingSphere(boundingSphere, new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius));
      this.viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      // this.viewer.scene.globe.globeAlpha = 0;
      // tile3d.show = false;
    }).otherwise((error) => {
      throw (error);
    });
  }
  flytoShangHai() {
    this.viewer.scene.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095),
    });
  }

  addRiverDom() {
    const urlTemplateImagery = this.viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: config.mapConfig.patrol_myb_20190626,
      rectangle: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095)
    }));
  }

  addEvt() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // todo：在椭球下点击创建点
    handler.setInputAction((event) => {
      const cartesian = this.viewer.camera.pickEllipsoid(event.position, this.viewer.scene.globe.ellipsoid);
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const obj = this.viewer.scene.pick(event.position);
      if (Cesium.defined(obj)) {
        if (obj.id && obj.id.properties) { // 点击建筑物等获取属性
          console.log(obj.id.properties.type);
          // const str = obj.id._name;
          // if (str === "yscNoNeedEntity")
          //   return;
          // callback(obj.id._id);
          this.showInfoWindow(lon, lat, obj.id.properties.type);
        } else {// 点击3dtiles获取属性；
          // console.log(obj.getPropertyNames()); // 点击3dtiles获取属性字段；
          alert(obj.getProperty('name')); // 点击建筑物获取属性值；
          // alert(obj.getProperty('name'));
          obj.color = Cesium.Color.BLUE.withAlpha(0.5);
        }

      } else {
        this.hideInfoWindow();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  showInfoWindow(lon, lat, infoData) {
    const divPosition = Cesium.Cartesian3.fromDegrees(lon, lat);
    const cartesian2 = new Cesium.Cartesian2(); // cesium二维笛卡尔 笛卡尔二维坐标系就是我们熟知的而二维坐标系；三维也如此
    const canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(divPosition, cartesian2); // cartesianToCanvasCoordinates 笛卡尔坐标（3维度）到画布坐标
    const element = document.getElementById('infoWindow1');
    element.style.display = 'block';
    element.style.top = (canvasPosition.y + 64 - 100 - 150) + 'px';
    element.style.left = (canvasPosition.x + 200) + 'px';
    const elementinfo = document.getElementById('infoWindow');
    elementinfo.style.display = 'block';
    const elementLine = document.getElementById('infoLine');
    elementLine.style.display = 'block';
    this.infodata = infoData;
    this.viewer.scene.preRender.addEventListener(() => {
      const canvasPosition1 = this.viewer.scene.cartesianToCanvasCoordinates(divPosition, cartesian2);
      // cartesianToCanvasCoordinates 笛卡尔坐标（3维度）到画布坐标
      if (Cesium.defined(canvasPosition)) {
        element.style.top = (canvasPosition1.y + 64 - 100 - 150) + 'px';
        element.style.left = (canvasPosition1.x + 200) + 'px';
      }
    });
  }

  hideInfoWindow() {
    const element = document.getElementById('infoWindow1');
    element.style.display = 'none';
  }

  flytoTest() {
    this.patrolName = '蕰藻浜';
    this.riverInfo = this.wzbInfo;
    this.viewer.scene.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(121.32646090152255, 31.31781474832142, 450),
      orientation: {
        heading: Cesium.Math.toRadians(55), // default value is 0.0 (north)
        pitch: Cesium.Math.toRadians(-25),    // default value:-90 (looking down)
        roll: 0.0                             // default value
      },
      duration: 3
    });
  }

  flytoMayibang() {
    this.patrolName = '蚂蚁浜';
    this.riverInfo = this.mybInfo;
    this.panel.active = true;
    this.viewer.scene.camera.flyTo({
      // destination: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095),
      destination: new Cesium.Cartesian3.fromDegrees(121.450265, 31.284222, 300),
      orientation: {
        heading: Cesium.Math.toRadians(0), // default value is 0.0 (north)
        pitch: Cesium.Math.toRadians(-25),    // default value:-90 (looking down)
        roll: Cesium.Math.toRadians(0)        // default value
      },
      duration: 3
    });
    // this.losAngelesToTokyo(true);
  }

  addWaterPro() {
    this.apiService.getWaterQualityPro()
      .subscribe((data: any) => {
        if (data) {
          data.features.forEach((fea, i) => {
            if (fea.properties.type === '水质问题') {
              const position = {
                x: fea.geometry.coordinates[0],
                y: fea.geometry.coordinates[1],
                h: 0
              };

              this.addCircleRipple(this.viewer, {
                id: i,
                lon: fea.geometry.coordinates[0],
                lat: fea.geometry.coordinates[1],
                height: 0,
                maxR: 3,
                minR: 0, // 最好为0
                deviationR: 0.05, // 差值 差值也大 速度越快
                eachInterval: 100, // 两个圈的时间间隔
                imageUrl: 'assets/img/redCircle2.png'
              });
            }

          });
        }
      });
  }

  addPatrolPro() {
    this.apiService.getWaterQualityPro()
      .subscribe((data: any) => {
        if (data) {
          console.log(JSON.stringify(data));
          data.features.forEach((fea, i) => {
            if (fea.properties.type !== '水质问题') {
              if (fea.properties.type === '水域保洁') {
                this.waterCleanData.push({
                  lon: fea.geometry.coordinates[0],
                  lat: fea.geometry.coordinates[1],
                  h: 30,
                  imgUrl: 'assets/img/' + fea.properties.type + '.png',
                  type: '水域保洁'
                });
              } else if (fea.properties.type === '陆域保洁') {
                this.landCleanData.push({
                  lon: fea.geometry.coordinates[0],
                  lat: fea.geometry.coordinates[1],
                  h: 30,
                  imgUrl: 'assets/img/' + fea.properties.type + '.png',
                  type: '陆域保洁'
                });
              } else {
                this.riverAboutData.push({
                  lon: fea.geometry.coordinates[0],
                  lat: fea.geometry.coordinates[1],
                  h: 30,
                  imgUrl: 'assets/img/' + fea.properties.type + '.png',
                  type: fea.properties.type
                });
              }
              const position = {
                x: fea.geometry.coordinates[0],
                y: fea.geometry.coordinates[1],
                h: 0
              };
              this.addBillboard(position, 'assets/img/' + fea.properties.type + '.png', fea.properties);
            }

          });
        }
      });
  }

  addBillboard(position, imgUrl, properties) {
    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
      billboard: {
        image: imgUrl,
        width: 32, // default: undefined
        height: 32 // default: undefined
      },
      // tslint:disable-next-line:object-literal-shorthand
      properties: properties
    });
  }
  /**
   * 添加建筑物模型
   */
  addBuildings() {
    const promise = Cesium.GeoJsonDataSource.load('assets/data/buildings84.geojson');
    promise.then((dataSource) => {
      this.viewer.dataSources.add(dataSource);

      // Get the array of entities
      const entities = dataSource.entities.values;
      entities.forEach((entity) => {
        const height = entity.properties.楼层.getValue();
        entity.polygon.material = new Cesium.Color(1, 1, 1, 0.2);
        entity.polygon.outline = false;
        entity.polygon.extrudedHeight = height * 2;
      });

    }).otherwise((error) => {
      // Display any errrors encountered while loading.
      // window.alert(error);
    });
  }

  addBuildings1() {
    const promise = Cesium.GeoJsonDataSource.load('assets/data/building.geojson');
    promise.then((dataSource) => {
      this.viewer.dataSources.add(dataSource);

      // Get the array of entities
      const entities = dataSource.entities.values;
      entities.forEach((entity) => {
        const height = Math.floor(Math.random() * 20 + 1);
        entity.polygon.material = new Cesium.Color(1, 1, 1, 0.2);
        entity.polygon.outline = false;
        entity.polygon.extrudedHeight = height * 2;
      });

    }).otherwise((error) => {
      // Display any errrors encountered while loading.
      // window.alert(error);
    });
  }

  addRedLine() {
    // Seed the random number generator for repeatable results.
    // Cesium.Math.setRandomNumberSeed(0);

    const promise = Cesium.GeoJsonDataSource.load('assets/data/redline.geojson');
    promise.then((dataSource) => {
      this.viewer.dataSources.add(dataSource);

      // Get the array of entities
      const entities = dataSource.entities.values;
      entities.forEach((entity) => {
        const type = entity.properties.type.getValue();
        if (type === 0) {
          entity.polyline.width = 1;
          entity.polyline.material = new Cesium.PolylineDashMaterialProperty({ // 虚线
            color: Cesium.Color.CYAN
          });
        } else {
          entity.polyline.width = 3;
          entity.polyline.material = Cesium.Color.CRIMSON;
        }
        entity.polyline.clampToGround = true;
      });

    }).otherwise((error) => {
      // Display any errrors encountered while loading.
      // window.alert(error);
    });
  }

  addCircleRipple(viewer, data) {
    let r1 = data.minR;
    let r2 = data.minR;

    function changeR1() { // 这是callback，参数不能内传
      r1 = r1 + data.deviationR;
      if (r1 >= data.maxR) {
        r1 = data.minR;
      }

      return r1;
    }
    function changeR2() {
      r2 = r2 + data.deviationR;
      if (r2 >= data.maxR) {
        r2 = data.minR;
      }
      return r2;
    }
    viewer.entities.add({
      id: data.id,
      name: '',
      position: Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.height),
      ellipse: {
        semiMinorAxis: new Cesium.CallbackProperty(changeR1, false),
        semiMajorAxis: new Cesium.CallbackProperty(changeR1, false),
        height: data.height,
        material: new Cesium.ImageMaterialProperty({
          image: data.imageUrl,
          repeat: new Cesium.Cartesian2(1.0, 1.0),
          transparent: true,
          color: new Cesium.CallbackProperty(() => {
            const alp = 1 - r1 / data.maxR;
            return Cesium.Color.WHITE.withAlpha(alp);  // entity的颜色透明 并不影响材质，并且 entity也会透明哦
          }, false)
        })
      }
    });
    setTimeout(() => {
      viewer.entities.add({
        name: '',
        position: Cesium.Cartesian3.fromDegrees(data.lon, data.lat, data.height),
        ellipse: {
          semiMinorAxis: new Cesium.CallbackProperty(changeR2, false),
          semiMajorAxis: new Cesium.CallbackProperty(changeR2, false),
          height: data.height,
          material: new Cesium.ImageMaterialProperty({
            image: data.imageUrl,
            repeat: new Cesium.Cartesian2(1.0, 1.0),
            transparent: true,
            color: new Cesium.CallbackProperty(() => {
              let alp = 1;
              alp = 1 - r2 / data.maxR;
              return Cesium.Color.WHITE.withAlpha(alp);
            }, false)
          })
        }
      });
    }, data.eachInterval);
  }

  /**
   * 问题点漫游
   */
  roaming(data) {
    const cameraOption = [];
    data.forEach((ele, i) => {
      cameraOption[i] = {
        destination: new Cesium.Cartesian3.fromDegrees(ele.lon, ele.lat, ele.h),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: Cesium.Math.toRadians(0)
        },
        duration: 3
      };
    });

    if (cameraOption.length === 1) {
      this.viewer.scene.camera.flyTo(cameraOption[0]);
      this.showInfoWindow(data[0].lon, data[0].lat, data[0].type);
      // 根据当前问题点经纬度展示弹出框
    } else if (cameraOption.length > 1) {
      cameraOption.forEach((option, i) => {
        if (i !== (cameraOption.length - 1)) {
          option.complete = () => {
            this.showInfoWindow(data[i].lon, data[i].lat, data[i].type);
            this.flagTimer = setTimeout(() => {
              this.viewer.scene.camera.flyTo(cameraOption[i + 1]);
              this.showInfoWindow(data[i + 1].lon, data[i + 1].lat, data[i + 1].type);
            }, 2000);
          };
        }
      });
      this.viewer.scene.camera.flyTo(cameraOption[0]);
    }
  }

  mouseOverfun() {
    clearTimeout(this.flagTimer);
  }

  /**
   * 添加倾斜摄影模型
   */
  addTPModel() {
    // 添加矢量建筑物3dtiles瓦片
    // const tile3d = new Cesium.Cesium3DTileset({ url: config.mapConfig.buildingsUrl });
    // tile3d.style = new Cesium.Cesium3DTileStyle({
    //   color: {
    //     conditions: [
    //       ['${height} >= 100', 'color("purple", 0.5)'],
    //       ['${height} >= 50', 'color("red")'],
    //       ['true', 'color("blue")']
    //     ]
    //   },
    //   show: '${height} > 0',
    //   meta: {
    //     description: '"Building id ${id} has height ${height}."'
    //   }
    // });
    // 添加大雁塔倾斜摄影模型3dtiles瓦片
    const tile3d = new Cesium.Cesium3DTileset({ url: config.mapConfig.dayantaUrl });
    this.TPModel = this.viewer.scene.primitives.add(tile3d);
    this.TPModel.readyPromise.then(() => {
      const boundingSphere = this.TPModel.boundingSphere;
      this.viewer.scene.camera.viewBoundingSphere(boundingSphere, new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius));
      this.viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      // this.viewer.scene.globe.globeAlpha = 0;
      // tile3d.show = false;
    }).otherwise((error) => {
      throw (error);
    });
    // 添加大雁塔矢量分类
    const tile3dClass = new Cesium.Cesium3DTileset({
      url: config.mapConfig.dayataclassifyUrl2, // 有问题的示例config.mapConfig.dayataclassifyUrl2
      classificationType: Cesium.ClassificationType.CESIUM_3D_TILE
    });
    tile3dClass.style = new Cesium.Cesium3DTileStyle({
      color: 'rgba(255, 0, 0, 0.01)'
    });
    this.TPModelClass = this.viewer.scene.primitives.add(tile3dClass);
  }

  show3Dtiles() {
    if (this.TPModel) {
      const boundingSphere = this.TPModel.boundingSphere;
      this.viewer.scene.camera.viewBoundingSphere(boundingSphere, new Cesium.HeadingPitchRange(0.0, -0.5, boundingSphere.radius));
      this.viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    } else {
      this.addTPModel();
    }
  }

  addUnderWaterShape() {
    this.apiService.getUnderWater().subscribe((data: any) => {
      if (data) {
        this.underWaterShape = data;
        console.log(this.underWaterShape);
      }
    });
  }

  showUnderGround() {
    console.log('展示水下地形');
    const globe = this.viewer.scene.globe;
    globe.globeAlpha = 0;
    if (!this.underWaterSource) {
      if (this.underWaterShape) {
        this.createUnderWaterShape(this.underWaterShape);
      }
    }

    this.viewer.scene.undergroundMode = true;
    this.baseMap.show = 0.5;
    this.flytoTest();
  }

  // 添加河道水面动态效果
  addWaterFace() {
    this.apiService.getWaterFace()
      .subscribe((data: any) => {
        if (data) {
          this.waterFaceData = data;
          this.createWaterFace(this.waterFaceData[0]);
          this.createWaterFace(this.waterFaceData[1]);
        }
      });
  }

  createWaterFace(data) {
    const waterPoly = this.viewer.scene.primitives.add(new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(data)
          ),
          // extrudedHeight: 1,
          height: 3,
          vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
        })
      }),
      // appearance: new Cesium.EllipsoidSurfaceAppearance({
      //   material: new Cesium.Material({
      //     fabric: {
      //       type: 'Color',
      //       uniforms: {
      //         color: Cesium.Color.AQUA
      //       }
      //     }
      //   })
      // })
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        aboveGround: false,
        material: new Cesium.Material({
          fabric: {
            type: 'Water',
            uniforms: {
              baseWaterColor: new Cesium.Color(12 / 255, 48 / 255, 123 / 255, 1),
              blendColor: new Cesium.Color(0.5, 1.0, 1.0, 1.0),
              // specularMap: '../assets/water/earthspec1k.jpg',
              // normalMap: 'assets/img/waterNormals.jpg',
              normalMap: 'assets/img/water.jpg',
              frequency: 2000,
              animationSpeed: 0.01,
              amplitude: 10.0,
              specularIntensity: 2,
              fadeFactor: 2.0
            }
          }
        }),
        fragmentShaderSource: 'varying vec3 v_positionMC;\nvarying vec3 v_positionEC;\nvarying vec2 v_st;\nvoid main()\n{\nczm_materialInput materialInput;\nvec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));\n#ifdef FACE_FORWARD\nnormalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);\n#endif\nmaterialInput.s = v_st.s;\nmaterialInput.st = v_st;\nmaterialInput.str = vec3(v_st, 0.0);\nmaterialInput.normalEC = normalEC;\nmaterialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);\nvec3 positionToEyeEC = -v_positionEC;\nmaterialInput.positionToEyeEC = positionToEyeEC;\nczm_material material = czm_getMaterial(materialInput);\n#ifdef FLAT\ngl_FragColor = vec4(material.diffuse + material.emission, material.alpha);\n#else\ngl_FragColor = czm_phong(normalize(positionToEyeEC), material);\
        gl_FragColor.a=0.5;\n#endif\n}\n' // 重写shader，修改水面的透明度
      })
    }));
    // 附材质
    // waterPoly.appearance.material = new Cesium.Material({
    //   fabric: {
    //     type: 'Water',
    //     uniforms: {
    //       // specularMap: '../assets/water/earthspec1k.jpg',
    //       normalMap: 'assets/img/waterNormals.jpg',
    //       frequency: 50000.0,
    //       animationSpeed: 0.05,
    //       amplitude: 5.0
    //     }
    //   }
    // });
  }

  // 这里的河底地形其实就是带有高程信息的面
  createUnderWaterShape(data) {
    /*生成水表表面模型*/
    const json = this.json2geojson(data);
    console.log(json);
    this.pointJson = json;
    const tin = turf.tin(json, 'z');
    // 直接生成的三角网坐标里是没有高程的
    for (let i = tin.features.length - 1; i >= 0; i--) {
      const properties = tin.features[i].properties;
      const aHeight = properties.a;
      const bHeight = properties.b;
      const cHeight = properties.c;
      const geometry = tin.features[i].geometry;
      const area = turf.area(geometry);
      if (area > 20) {
        // 如果三角形的面积大于20，就在三角网中删除该三角形
        tin.features.splice(i, 1);
        continue;
      }
      // 给坐标赋z值
      geometry.coordinates[0][0][2] = aHeight;
      geometry.coordinates[0][1][2] = bHeight;
      geometry.coordinates[0][2][2] = cHeight;
      geometry.coordinates[0][3][2] = aHeight;
    }
    console.log(tin);
    this.underWaterSource = Cesium.GeoJsonDataSource.load(tin);
    const scene = this.viewer.scene;
    this.underWaterSource.then((source) => {
      this.viewer.dataSources.add(source);
      // this.viewer.flyTo(source);
      // const entities = source.entities.values;
      // entities.forEach((entity) => {
      //   entity.polygon.material = new Cesium.Color(255 / 255, 255 / 255, 0 / 255, 0.3);
      //   entity.polygon.outlineColor = new Cesium.Color(255 / 255, 128 / 255, 255 / 255, 1);
      // });
    });
  }

  json2geojson(dataSources: any) {
    if (dataSources && dataSources.features) {
      const features = dataSources.features;
      const geoArray = [];
      features.forEach((item) => {
        const json = {
          type: 'Feature',
          geometry:
          {
            type: 'Point',
            coordinates: [item.geometry.x, item.geometry.y]
          },
          properties: {
            name: 'test',
            x: item.geometry.x,
            y: item.geometry.y,
            z: (item.attributes.grid_code - 3) * 10
          }
        };
        geoArray.push(json);
      });
      const geoJson = { type: 'FeatureCollection', features: geoArray };
      return geoJson;
    }
  }
}
