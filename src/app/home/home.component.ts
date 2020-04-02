import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '../../service/api.service';
declare const Cesium;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  viewer: any;
  constructor(private apiService: ApiService) { }


  ngOnInit() {
    this.initCesium();
  }

  initCesium() {
    const viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      timeline: false,
      sceneModePicker: false,
      // cesiumLogo: false,
      // selectionIndicator: false,
      navigationHelpButton: false,
      // infoBox: false,
      homeButton: false,
      // scene3DOnly: false,
      fullscreenButton: false,
      // vrButton: false,
      // imageryProvider: null
    });
    viewer._cesiumWidget._creditContainer.style.display = 'none';
    viewer.imageryLayers.remove(viewer.imageryLayers.get(0));
    // 增加谷歌影像底图
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: 'http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}',
      tilingScheme: new Cesium.WebMercatorTilingScheme()
    })
    );
    // arcgis底图
    // viewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
    //   url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    // }));
    // 添加蚂蚁浜正射影像WMTS
    // 121.463031, 31.22877
    // http://140.207.79.138:5080/geowebcache/service/tms/1.0.0/patrol_myb_20190626@EPSG%3A3857_patrol_myb_20190626@png
    const urlTemplateImageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: `http://140.207.79.138:5080/geoserver/gwc/service/tms/1.0.0/kalends%3Apatrol_myb_20190626@EPSG%3A900913@png/{z}/{x}/{reverseY}.png`,
      rectangle: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095)
    });
    viewer.imageryLayers.addImageryProvider(urlTemplateImageryProvider);
    // viewer.terrainProvider = Cesium.createWorldTerrain();
    // 打开深度检测，那么在地形以下的对象不可见
    // viewer.scene.globe.depthTestAgainstTerrain = true;
    // viewer.scene.globe.showGroundAtmosphere = false;
    /**完美倾斜效果方法的思路：
     * 根据extent[121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095]可以确定相机视角与地面的交点A，默认相机朝向并使用extent作为相机视域的情况下，会根据相机参数计算得到一个合适的高度h，将相机放在这个高度上，并朝向extent的中心点A。这种情况地面与屏幕是平行的，没有倾斜角度。在这种情况下，将地面倾斜到一定角度，相机的位置要往屏幕中心点的下方移动（新的点位B），与此同时，相机的高度会变小（h1），原来高度h将会A、B、h1的斜边。此时根据倾斜角、h（还有一个直角）可以计算出高度h1和AB两点的距离，再根据A坐标和AB的距离，可以计算出B点的坐标；
     */
    setTimeout(() => {
      viewer.scene.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095),
      });
    }, 3000);

    setTimeout(() => {
      viewer.scene.camera.flyTo({
        // destination: Cesium.Rectangle.fromDegrees(121.44672084220201, 31.28868194981397, 121.45407791350203, 31.29060935499095),
        destination: new Cesium.Cartesian3.fromDegrees(121.450265, 31.284222, 300),
        orientation: {
          heading: Cesium.Math.toRadians(0), // default value is 0.0 (north)
          pitch: Cesium.Math.toRadians(-25),    // default value:-90 (looking down)
          roll: Cesium.Math.toRadians(0)        // default value
        },
        duration: 3
      });
    }, 7000);
    this.viewer = viewer;

    this.addRedLine();
    this.addBuildings();
    // this.apiService.getBuildings()
    //   .subscribe((data: any) => {
    //     if (data) {
    //       console.log(data);
    //       this.addBuildings();
    //     }
    //   });
    this.apiService.getWaterQualityPro()
      .subscribe((data: any) => {
        if (data) {
          console.log(data);

          data.features.forEach((fea, i) => {
            const position = {
              x: fea.geometry.coordinates[0],
              y: fea.geometry.coordinates[1],
              h: 0
            };
            // this.addEllipsoid('i', position);
            // this.add(fea.geometry.coordinates[0], fea.geometry.coordinates[1]);
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
          });
        }
      });
  }
  addBuildings() {
    const promise = Cesium.GeoJsonDataSource.load('assets/data/buildings84.geojson');
    promise.then((dataSource) => {
      this.viewer.dataSources.add(dataSource);

      // Get the array of entities
      const entities = dataSource.entities.values;
      entities.forEach((entity) => {
        const height = entity.properties.楼层.getValue();
        // if (height === 6) {
        //   entity.polygon.material = Cesium.Color.CYAN;
        // } else if (height === 10) {
        //   entity.polygon.material = Cesium.Color.AQUAMARINE;
        // } else if (height === 12) {
        //   entity.polygon.material = Cesium.Color.BEIGE;
        // } else if (height === 15) {
        //   entity.polygon.material = Cesium.Color.CHARTREUSE;
        // } else if (height === 30) {
        //   entity.polygon.material = Cesium.Color.CORNFLOWERBLUE;
        // }
        entity.polygon.material = new Cesium.Color(1, 1, 1, 0.5);
        entity.polygon.outline = false;
        // Generate Polygon position
        // const polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; // 获取当前时间的一个位置消息
        // let polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center; // 获得一个中心区域
        // polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
        // entity.position = polyCenter;
        entity.polygon.extrudedHeight = height * 2;
      });

    }).otherwise((error) => {
      // Display any errrors encountered while loading.
      // window.alert(error);
    });
  }
  addRedLine() {
    // this.viewer.dataSources.add(Cesium.GeoJsonDataSource.load('assets/data/redline.geojson', {
    //   stroke: Cesium.Color.CRIMSON,
    //   strokeWidth: 1
    // }));

    // Seed the random number generator for repeatable results.
    Cesium.Math.setRandomNumberSeed(0);

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
      });

    }).otherwise((error) => {
      // Display any errrors encountered while loading.
      // window.alert(error);
    });
  }
  addEllipsoid(id, position) {
    const stripeMaterial = new Cesium.StripeMaterialProperty({
      evenColor: Cesium.Color.WHITE.withAlpha(0.5),
      oddColor: Cesium.Color.BLUE.withAlpha(0.5),
      repeat: 5.0
    });
    this.viewer.entities.add({
      name: id,
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y, position.h),
      // point: new Cesium.PointGraphics({
      //   pixelSize: 5,
      //   color: Cesium.Color.WHITE,
      //   outlineColor: Cesium.Color.BLACK,
      //   outlineWidth: 2
      // })
      ellipse: {
        semiMinorAxis: 5.0,
        semiMajorAxis: 5.0,
        rotation: Cesium.Math.toRadians(30.0),
        material: stripeMaterial
      }
    });
  }

  add(lon, lat) {
    const CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(lon), Cesium.Math
      .toRadians(lat), 0);
    const scanColor = new Cesium.Color(1.0, 0.0, 0.0, 1);
    this.AddCircleScanPostStage(this.viewer, CartographicCenter, 2, scanColor, 2000);
  }

  /*
    添加扫描线 depth关闭   lon:-74.01296152309055 lat:40.70524201566827 height:129.14366696393927
    viewer
    cartographicCenter 扫描中心
    maxRadius 最大半径 米
    scanColor 扫描颜色
    duration 持续时间 毫秒
    */
  AddCircleScanPostStage(viewer, cartographicCenter, maxRadius, scanColor, duration) {
    const ScanSegmentShader =
      `uniform sampler2D colorTexture;\n` +
      `uniform sampler2D depthTexture;\n` +
      `varying vec2 v_textureCoordinates;\n` +
      `uniform vec4 u_scanCenterEC;\n` +
      `uniform vec3 u_scanPlaneNormalEC;\n` +
      `uniform float u_radius;\n` +
      `uniform vec4 u_scanColor;\n` +
      `vec4 toEye(in vec2 uv, in float depth)\n` +
      ` {\n` +
      ` vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n` +
      ` vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n` +
      ` posInCamera =posInCamera / posInCamera.w;\n` +
      ` return posInCamera;\n` +
      ` }\n` +
      `vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n` +
      `{\n` +
      `vec3 v01 = point -planeOrigin;\n` +
      `float d = dot(planeNormal, v01) ;\n` +
      `return (point - planeNormal * d);\n` +
      `}\n` +
      `float getDepth(in vec4 depth)\n` +
      `{\n` +
      `float z_window = czm_unpackDepth(depth);\n` +
      `z_window = czm_reverseLogDepth(z_window);\n` +
      `float n_range = czm_depthRange.near;\n` +
      `float f_range = czm_depthRange.far;\n` +
      `return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n` +
      `}\n` +
      `void main()\n` +
      `{\n` +
      `gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n` +
      `float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));\n` +
      `vec4 viewPos = toEye(v_textureCoordinates, depth);\n` +
      `vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n` +
      `float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n` +
      `if(dis < u_radius)\n` +
      `{\n` +
      `float f = 1.0 -abs(u_radius - dis) / u_radius;\n` +
      `f = pow(f, 4.0);\n` +
      `gl_FragColor = mix(gl_FragColor, u_scanColor, f);\n` +
      `}\n` +
      `}\n`;
    const cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
    const cartesian4Center = new Cesium.Cartesian4(cartesian3Center.x, cartesian3Center.y, cartesian3Center.z,
      1);
    const cartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter
      .latitude,
      cartographicCenter.height + 500);
    const cartesian3Center1 = Cesium.Cartographic.toCartesian(cartographicCenter1);
    const cartesian4Center1 = new Cesium.Cartesian4(cartesian3Center1.x, cartesian3Center1.y,
      cartesian3Center1.z,
      1);
    const time = (new Date()).getTime();
    const scratchCartesian4Center = new Cesium.Cartesian4();
    const scratchCartesian4Center1 = new Cesium.Cartesian4();
    const scratchCartesian3Normal = new Cesium.Cartesian3();
    const ScanPostStage = new Cesium.PostProcessStage({
      fragmentShader: ScanSegmentShader,
      uniforms: {
        u_scanCenterEC: () => {
          return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center,
            scratchCartesian4Center);
        },
        u_scanPlaneNormalEC: () => {
          const temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix,
            cartesian4Center,
            scratchCartesian4Center);
          const temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix,
            cartesian4Center1,
            scratchCartesian4Center1);
          scratchCartesian3Normal.x = temp1.x - temp.x;
          scratchCartesian3Normal.y = temp1.y - temp.y;
          scratchCartesian3Normal.z = temp1.z - temp.z;
          Cesium.Cartesian3.normalize(scratchCartesian3Normal, scratchCartesian3Normal);
          return scratchCartesian3Normal;
        },
        u_radius: () => {
          return maxRadius * (((new Date()).getTime() - time) % duration) / duration;
        },
        u_scanColor: scanColor
      }
    });
    viewer.scene.postProcessStages.add(ScanPostStage);
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
}
