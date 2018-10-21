(function () {
  var utils = Vue.prototype.$utils = {};

  /**
   * 验证
   */
  utils.validate = {
    // 邮箱
    isEmail: function (s) {
      return /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(s);
    },
    // 手机号码
    isMobile: function (s) {
      return /^1[0-9]{10}$/.test(s);
    },
    // 电话号码
    isPhone: function (s) {
      return /^([0-9]{3,4}-)?[0-9]{7,8}$/.test(s);
    },
    // URL地址
    isURL: function (s) {
      return /^http[s]?:\/\/.*/.test(s);
    }
  };

  /**
   * 数字转换成大写
   */
  utils.digitUppercase = function (n) {
    var fraction = ['角', '分'];
    var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    var unit = [['元', '万', '亿'], ['', '拾', '佰', '仟', '万']];
    var num = Math.abs(n);
    var s = '';
    fraction.forEach(function (item, index) {
      index = index === 0 ? 1 : index;
      s += (digit[Math.floor(accMul(num, 10 * 10 * index)) % 10] + item).replace(/零./, '');
    });
    s = s || '整';
    num = Math.floor(num);
    for (var i = 0; i < unit[0].length && num > 0; i += 1) {
      var p = '';
      for (var j = 0; j < unit[1].length && num > 0; j += 1) {
        p = digit[num % 10] + unit[1][j] + p;
        num = Math.floor(num / 10);
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    function accMul(arg1, arg2) {
      var m = 0;
      var s1 = arg1.toString();
      var s2 = arg2.toString();
      m += s1.split('.').length > 1 ? s1.split('.')[1].length : 0;
      m += s2.split('.').length > 1 ? s2.split('.')[1].length : 0;
      return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / 10 * m;
    }
  
    return s
      .replace(/(零.)*零元/, '元')
      .replace(/(零.)+/g, '零')
      .replace(/^整$/, '零元整');
  };
})();