const net = require('net')
const HttpParser = require('./http-parser')
const HtmlParser = require('htmlparser2')
const css = require('css')
class HTTPRequest {
  constructor(options = {}) {
    this.host = options.host
    this.method = options.method || 'GET'
    this.path = options.path || '/'
    this.port = options.port || 80
    this.headers = options.headers || {}
  }
  send() {
    return new Promise((resolve, reject) => {
      // 构建http请求
      const rows = []
      rows.push(`${this.method} ${this.path} HTTP/1.1`) // 模拟浏览器的请求行

      Object.keys(this.headers).forEach(key => {
        rows.push(`${key}: ${this.headers[key]}`)
      })

      let data = rows.join('\r\n') + '\r\n\r\n'

      let socket = net.createConnection({ // 创建tcp链接 传输数据
        host: this.host,
        port: this.port
      }, () => {
        socket.write(data)
      })

      const parser = new HttpParser()
      socket.on('data', function (chunk) { // 事件会触发多次
        console.log(chunk) // chunk 是二进制流
        parser.parse(chunk)
        if (parser.result) {
          resolve(parser.result)
        }
      })
    })
  }
}

function parserCss(styleText) {
  const ast = css.parse(styleText)
  console.dir(ast.stylesheet, { depth: null });
}

async function request() {
  const request = new HTTPRequest({
    host: '127.0.0.1',
    method: 'GET',
    port: 3000,
    path: '/',
    headers: {
      name: 'jqb',
      age: 30
    }
  })
  let { responseLine, headers, body } = await request.send()
  // 浏览器会根据响应类型来解析文件 Content-Type: 'text/html'

  // html => html-parser => dom tree 词法分析 分析html

  // 解析后需要生成 tree， 典型的栈型结构
  let stack = [{ type: 'document', children: [] }] // 数据结构
  const parser = new HtmlParser.Parser({
    onopentag(name, attributes) {
      let parent = stack[stack.length - 1]
      let element = {
        type: 'element',
        tagName: name,
        attributes,
        children: [],
        parent
      }
      parent.children.push(element)
      stack.push(element)
      console.log('start', name, attributes)
    },
    ontext(text) {
      let parent = stack[stack.length - 1]
      let textNode = {
        type: 'text',
        text
      }
      parent.children.push(textNode)
    },
    onclosetag(name) {
      if (name === 'style') {
        let parent = stack[stack.length - 1]
        // parent.children[0]
        parserCss(parent.children[0].text)
      }
      stack.pop()
    }
  })
  // console.log(body);
  parser.end(body) // DOMTree 还要解析样式
  // console.dir(stack, { depth: null })
}

request()