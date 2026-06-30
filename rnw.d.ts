// react-native-web 未自带类型声明；我们只用到 unstable_createElement 逃生口。
declare module "react-native-web" {
  import type { ComponentType } from "react";
  export function unstable_createElement(component: string, props?: any): any;
  const RNW: any;
  export default RNW;
}
