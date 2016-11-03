# al-sku-picker
商品sku选择器

## Installation
```
npm i al-sku-picker
```
## Usage
```js
/*js文件*/
import Picker from 'al-sku-picker';
children = {
  picker: new Picker({
  	//...
  });
};
```
```xml
<!--xml组件-->
<component key="picker" name="al-sku-picker" />
```
```css
/*less文件*/
@import 'al-sku-picker';
```
## Props
|Property | PropType |Description|
|:---------|:----|:------|
|goods|array|商品数据，针对`alaska-goods`service数据结构|
|skuId|string|商品`sku`ID，若不为空，则对应的`sku`属性值选中|
|onChange|func|sku点击事件，返回`price`、`sku`id、`sku`标题|
