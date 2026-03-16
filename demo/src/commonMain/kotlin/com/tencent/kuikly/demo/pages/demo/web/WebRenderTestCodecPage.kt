/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.CodecModule
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * CodecModule 全方法测试页面
 * 覆盖：urlEncode、urlDecode、base64Encode、base64Decode、md5、md5With32、sha256
 * 使用固定输入字符串确保确定性渲染
 */
@Page("WebRenderTestCodec")
internal class WebRenderTestCodecPage : BasePager() {

    // 固定测试字符串
    private val testString = "hello,kuikly!你好"
    private val testUrl = "https://example.com/path?name=张三&age=25"

    // 测试结果状态
    private var urlEncodeResult by observable("未执行")
    private var urlDecodeResult by observable("未执行")
    private var base64EncodeResult by observable("未执行")
    private var base64DecodeResult by observable("未执行")
    private var md5Result by observable("未执行")
    private var md5With32Result by observable("未执行")
    private var sha256Result by observable("未执行")
    private var roundTripUrlResult by observable("未执行")
    private var roundTripBase64Result by observable("未执行")

    override fun body(): ViewBuilder {
        val ctx = this

        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF4CAF50))
                    }
                    Text {
                        attr {
                            text("CodecModule 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 测试输入
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE3F2FD))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("测试字符串: ${ctx.testString}")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                        }
                    }
                    Text {
                        attr {
                            text("测试URL: ${ctx.testUrl}")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                            marginTop(4f)
                        }
                    }
                }

                // 测试1: urlEncode
                SectionView("1. urlEncode", ctx.urlEncodeResult)

                // 测试2: urlDecode
                SectionView("2. urlDecode", ctx.urlDecodeResult)

                // 测试3: base64Encode
                SectionView("3. base64Encode", ctx.base64EncodeResult)

                // 测试4: base64Decode
                SectionView("4. base64Decode", ctx.base64DecodeResult)

                // 测试5: md5 (16位)
                SectionView("5. md5 (16位)", ctx.md5Result)

                // 测试6: md5With32 (32位)
                SectionView("6. md5With32 (32位)", ctx.md5With32Result)

                // 测试7: sha256
                SectionView("7. sha256", ctx.sha256Result)

                // 测试8: URL 编解码往返
                SectionView("8. URL 编解码往返验证", ctx.roundTripUrlResult)

                // 测试9: Base64 编解码往返
                SectionView("9. Base64 编解码往返验证", ctx.roundTripBase64Result)

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    override fun created() {
        super.created()
        runCodecTests()
    }

    private fun runCodecTests() {
        val codecModule = acquireModule<CodecModule>(CodecModule.MODULE_NAME)

        // 测试1: urlEncode
        val encoded = codecModule.urlEncode(testUrl)
        urlEncodeResult = "输入: $testUrl\n编码: $encoded"

        // 测试2: urlDecode
        val decoded = codecModule.urlDecode(encoded)
        urlDecodeResult = "输入: $encoded\n解码: $decoded"

        // 测试3: base64Encode
        val base64Encoded = codecModule.base64Encode(testString)
        base64EncodeResult = "输入: $testString\n编码: $base64Encoded"

        // 测试4: base64Decode
        val base64Decoded = codecModule.base64Decode(base64Encoded)
        base64DecodeResult = "输入: $base64Encoded\n解码: $base64Decoded"

        // 测试5: md5 (16位)
        val md5Value = codecModule.md5(testString)
        md5Result = "输入: $testString\nMD5(16位): $md5Value\n长度: ${md5Value.length}"

        // 测试6: md5With32 (32位)
        val md5With32Value = codecModule.md5With32(testString)
        md5With32Result = "输入: $testString\nMD5(32位): $md5With32Value\n长度: ${md5With32Value.length}"

        // 测试7: sha256
        val sha256Value = codecModule.sha256(testString)
        sha256Result = "输入: $testString\nSHA256: $sha256Value\n长度: ${sha256Value.length}"

        // 测试8: URL 编解码往返验证
        val urlRoundTrip = codecModule.urlDecode(codecModule.urlEncode(testUrl))
        val urlMatch = urlRoundTrip == testUrl
        roundTripUrlResult = "原始: $testUrl\n往返: $urlRoundTrip\n匹配: $urlMatch"

        // 测试9: Base64 编解码往返验证
        val base64RoundTrip = codecModule.base64Decode(codecModule.base64Encode(testString))
        val base64Match = base64RoundTrip == testString
        roundTripBase64Result = "原始: $testString\n往返: $base64RoundTrip\n匹配: $base64Match"
    }

    private fun ViewBuilder.SectionView(title: String, content: String) {
        View {
            attr {
                margin(12f)
                padding(12f)
                backgroundColor(Color(0xFFF5F5F5))
                borderRadius(8f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    fontWeightBold()
                    color(Color(0xFF333333))
                    marginBottom(8f)
                }
            }
            View {
                attr {
                    padding(8f)
                    backgroundColor(Color.WHITE)
                    borderRadius(4f)
                }
                Text {
                    attr {
                        text(content)
                        fontSize(12f)
                        color(Color(0xFF666666))
                        lineHeight(18f)
                    }
                }
            }
        }
    }
}
