/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-18
 * @author lulu <lulu@maichong.it>
 */

import wx from 'labrador';
import  _without  from 'lodash/without';
import  _clone  from 'lodash/clone';
const { string, func, object } = wx.PropTypes;

export default class SkuPicker extends wx.Component {
  propTypes = {
    onChange: func.isRequired,
    skuId: string,
    goods: object.isRequired
  };

  data = {
    skuResult: {},
    selectSkus: [],
    price: '',
    skus: [],
    keys: [],
    skuId: ''
  };

  children = {};

  onLoad() {

  }

  onReady() {

  }

  onShow() {

  }

  onHide() {

  }

  onUnload() {

  }

  onUpdate(props) {
    if (props.skuId) {
      this.setData({ skuId: props.skuId });
    }
    let goods = props.goods;
    if (goods && goods.props) {
      let propsArr = goods.props;
      let skus = [];
      for (let prop of propsArr) {
        if (prop.sku) {
          let values = [];
          for (let item of prop.values) {
            let obj = {
              id: item.value,
              label: item.label,
              hasInventory: true,
              isSelected: false,
              prop: prop.id
            };
            values.push(obj);
          }
          let record = {
            id: prop.id,
            title: prop.title,
            values: values
          };
          skus.push(record);
        }
      }
      this.setData({ skus });
      let goodsSkus = goods.skus;
      let obj = {};
      let selectSkus = [];
      for (let item of goodsSkus) {
        let propValue = [];
        for (let prop in item.props) {
          if (props.skuId && item.id === this.data.skuId) {
            selectSkus.push(item.props[prop]);
          }
          propValue.push(item.props[prop]);
        }
        obj[propValue.join(';')] = {
          price: item.discount ? item.discount : item.price,
          count: item.inventory,
          key: item.key,
          id: item.id
        }
      }
      this.setData('data', obj);
      this.initSKU();
      let tempSelectSkus = _clone(this.data.selectSkus);
      selectSkus = selectSkus.length ? selectSkus : tempSelectSkus;
      this.setData({ skus: skus });
      let keys = this.checkInventory(selectSkus);
      this.setData({ skus: keys, selectSkus });
    }
  }

//获得对象的key
  getObjKeys(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    let keys = [];
    for (let key in obj)
      if (Object.prototype.hasOwnProperty.call(obj, key))
        keys[keys.length] = key;
    return keys;
  }

//把组合的key放入结果集skuResult
  add2skuResult(combArrItem, sku) {
    let skuResult = this.data.skuResult;
    let key = combArrItem.join(";");
    if (skuResult[key]) {//SKU信息key属性·
      skuResult[key].count += sku.count;
      skuResult[key].prices.push(sku.price);
    } else {
      skuResult[key] = {
        count: sku.count,
        prices: [sku.price]
      };
    }
  }

//初始化得到结果集
  initSKU() {
    let data = this.data.data;
    let skuResult = this.data.skuResult;
    let me = this;
    let i, j, skuKeys = me.getObjKeys(data);
    for (i = 0; i < skuKeys.length; i++) {
      let skuKey = skuKeys[i];//一条SKU信息key
      let sku = data[skuKey];	//一条SKU信息value

      let skuKeyAttrs = skuKey.split(";"); //SKU信息key属性值数组
      skuKeyAttrs.sort();

      //对每个SKU信息key属性值进行拆分组合
      let combArr = me.combInArray(skuKeyAttrs);
      for (j = 0; j < combArr.length; j++) {
        me.add2skuResult(combArr[j], sku);
      }

      //结果集接放入skuResult
      skuResult[skuKeyAttrs.join(";")] = {
        count: sku.count,
        prices: [sku.price],
        id: sku.id,
        key: sku.key
      }
    }
    this.setData({ skuResult });
  }

  /**
   * 从数组中生成指定长度的组合
   * 方法: 先生成[0,1...]形式的数组, 然后根据0,1从原数组取元素，得到组合数组
   */
  combInArray(aData) {
    let me = this;
    if (!aData || !aData.length) {
      return [];
    }

    let len = aData.length;
    let aResult = [];

    for (let n = 1; n < len; n++) {
      let aaFlags = me.getCombFlags(len, n);
      while (aaFlags.length) {
        let aFlag = aaFlags.shift();
        let aComb = [];
        for (let i = 0; i < len; i++) {
          aFlag[i] && aComb.push(aData[i]);
        }
        aResult.push(aComb);
      }
    }

    return aResult;
  }

  /**
   * 得到从 m 元素中取 n 元素的所有组合
   * 结果为[0,1...]形式的数组, 1表示选中，0表示不选
   */
  getCombFlags(m, n) {
    if (!n || n < 1) {
      return [];
    }

    let aResult = [];
    let aFlag = [];
    let bNext = true;
    let i, j, iCnt1;

    for (i = 0; i < m; i++) {
      aFlag[i] = i < n ? 1 : 0;
    }

    aResult.push(aFlag.concat());

    while (bNext) {
      iCnt1 = 0;
      for (i = 0; i < m - 1; i++) {
        if (aFlag[i] == 1 && aFlag[i + 1] == 0) {
          for (j = 0; j < i; j++) {
            aFlag[j] = j < iCnt1 ? 1 : 0;
          }
          aFlag[i] = 0;
          aFlag[i + 1] = 1;
          let aTmp = aFlag.concat();
          aResult.push(aTmp);
          if (aTmp.slice(-n).join("").indexOf('0') == -1) {
            bNext = false;
          }
          break;
        }
        aFlag[i] == 1 && iCnt1++;
      }
    }
    return aResult;
  }

  checkInventory(selectSkus) {
    let skuResult = this.data.skuResult;
    let keys = _clone(this.data.skus);
    let others = [];
    for (let item of keys) {
      for (let record of item.values) {
        if (selectSkus.indexOf(record.id) !== -1) {
          record.isSelected = true
        } else {
          record.isSelected = false;
          others.push(record);
        }
      }
    }
    for (let item of others) {
      let testSelectSkus = [];
      for (let _item of keys) {
        for (let _record of _item.values) {
          if (_item.id !== item.prop) {
            if (_record.isSelected === true) {
              testSelectSkus.push(_record.id);
            }
          }
        }
      }

      testSelectSkus = testSelectSkus.concat(item.id);
      testSelectSkus.sort();
      let tempResult = skuResult[testSelectSkus.join(';')];
      item.hasInventory = false;
      if (tempResult && tempResult.count > 0) {
        item.hasInventory = true;
      }
    }
    for (let item of keys) {
      for (let record of item.values) {
        for (let _item of others) {
          if (_item.id == record.id) {
            record = _item;
          }
        }
      }
    }
    return keys;
  }

  refresh(selectSkus) {
    let keys = _clone(this.data.skus);
    let price = this.props.goods.price;
    let skuResult = this.data.skuResult;

    if (selectSkus.length) {
      selectSkus.sort();
      //价格显示
      let prices = skuResult[selectSkus.join(';')].prices;
      let maxPrice = Math.max.apply(Math, prices);
      let minPrice = Math.min.apply(Math, prices);
      price = maxPrice > minPrice ? minPrice + '-' + maxPrice : maxPrice;
      keys = this.checkInventory(selectSkus);
    }
    this.setData({ skus: keys, selectSkus });
    let skuId = '';
    if (keys.length === selectSkus.length) {
      let tempArr = selectSkus;
      tempArr.sort();
      skuId = skuResult[tempArr.join(';')].id;
    }
    let skuLabel = [];
    for (let item of this.data.skus) {
      for (let record of item.values) {
        if (selectSkus.indexOf(record.id) !== -1) {
          skuLabel.push(record.label);
        }
      }
    }
    this.props.onChange(price, skuId, skuLabel);
  }

  handleSelectSku(e) {
    let selectSkus = _clone(this.data.selectSkus);
    let id = e.currentTarget.dataset.id;
    let prop = e.currentTarget.dataset.prop;
    let keys = this.data.skus;
    for (let item of keys) {
      if (item.id == prop) {
        for (let record of item.values) {
          if (record.id !== id) {
            selectSkus = _without(selectSkus, record.id);
          } else {
            if (selectSkus.indexOf(record.id) !== -1) {
              selectSkus = _without(selectSkus, record.id);
            } else {
              selectSkus.push(id);
            }
          }
        }
      }
    }
    this.refresh(selectSkus, id);
  }
}
