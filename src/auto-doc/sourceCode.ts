/**
 * say 你好
 * @param name 名字
 * @param age 年龄
 * @param a 
 * @returns 
 */
function sayHi (name: string, age: number, a: boolean) {
  console.log(`hi, ${name}`);
  return `hi, ${name}`;
}

/**
* Person类
*/
class Person {
  name: string; // name 属性
  constructor(name: string) {
      this.name = name;
  }

  /**
   * 方法测试
   */
  sayHi (): string {
      return `hi, I'm ${this.name}`;
  }
}