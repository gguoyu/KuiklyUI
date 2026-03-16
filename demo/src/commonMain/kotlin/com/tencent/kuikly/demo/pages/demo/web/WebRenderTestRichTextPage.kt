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
import com.tencent.kuikly.core.base.BackgroundLinearGradient
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.GradientDirection
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.base.ViewContainer
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.RichText
import com.tencent.kuikly.core.views.Span
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRRichTextView 全属性测试页面
 * 覆盖以下属性：
 * - numberOfLines/lines
 * - lineBreakMode/textOverflow
 * - headIndent
 * - text/color
 * - letterSpacing
 * - textDecoration (underline/line-through)
 * - textAlign (left/center/right)
 * - lineSpacing/lineHeight
 * - fontWeight/fontStyle/fontFamily/fontSize
 * - backgroundImage (渐变文字)
 * - strokeWidth/strokeColor
 */
@Page("WebRenderTestRichText")
internal class WebRenderTestRichTextPage : BasePager() {

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // 标题栏
            View {
                attr {
                    height(44f)
                    backgroundColor(Color(0xFF4A90E2))
                    justifyContentCenter()
                    alignItemsCenter()
                }
                Text {
                    attr {
                        text("RichText组件属性测试")
                        fontSize(18f)
                        color(Color.WHITE)
                        fontWeight700()
                    }
                }
            }

            List {
                attr {
                    flex(1f)
                }

                // ========== 1. 基础文本属性 ==========
                SectionHeader("1. 基础 - text/color/fontSize")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("默认文本 fontSize=14")
                            fontSize(14f)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("红色文本 fontSize=16")
                            fontSize(16f)
                            color(Color.RED)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("蓝色文本 fontSize=20")
                            fontSize(20f)
                            color(Color.BLUE)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("大号文本 fontSize=28")
                            fontSize(28f)
                            color(Color(0xFF9B59B6))
                        }
                    }
                }

                // ========== 2. fontWeight 字重 ==========
                SectionHeader("2. fontWeight - 字重")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("fontWeight 100 - 极细")
                            fontSize(16f)
                            fontWeight100()
                            marginBottom(5f)
                        }
                    }
                    Text {
                        attr {
                            text("fontWeight 300 - 细体")
                            fontSize(16f)
                            fontWeight300()
                            marginBottom(5f)
                        }
                    }
                    Text {
                        attr {
                            text("fontWeight 400 - 正常")
                            fontSize(16f)
                            fontWeight400()
                            marginBottom(5f)
                        }
                    }
                    Text {
                        attr {
                            text("fontWeight 500 - 中等")
                            fontSize(16f)
                            fontWeight500()
                            marginBottom(5f)
                        }
                    }
                    Text {
                        attr {
                            text("fontWeight 700 - 粗体")
                            fontSize(16f)
                            fontWeight700()
                            marginBottom(5f)
                        }
                    }
                    Text {
                        attr {
                            text("fontWeight 900 - 极粗")
                            fontSize(16f)
                            fontWeight900()
                        }
                    }
                }

                // ========== 3. fontStyle 字体样式 ==========
                SectionHeader("3. fontStyle - 字体样式")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        flexWrapWrap()
                    }
                    Text {
                        attr {
                            text("Normal 正常")
                            fontSize(16f)
                            fontStyleNormal()
                            marginRight(20f)
                        }
                    }
                    Text {
                        attr {
                            text("Italic 斜体")
                            fontSize(16f)
                            fontStyleItalic()
                        }
                    }
                }

                // ========== 4. textAlign 文本对齐 ==========
                SectionHeader("4. textAlign - 文本对齐")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("左对齐 textAlign=left")
                            fontSize(14f)
                            textAlign("left")
                            backgroundColor(Color(0x20000000))
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("居中对齐 textAlign=center")
                            fontSize(14f)
                            textAlign("center")
                            backgroundColor(Color(0x20000000))
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("右对齐 textAlign=right")
                            fontSize(14f)
                            textAlign("right")
                            backgroundColor(Color(0x20000000))
                        }
                    }
                }

                // ========== 5. lines/numberOfLines ==========
                SectionHeader("5. lines - 行数限制")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("这是一段很长的文本，用于测试行数限制功能。当文本内容超过指定的行数时，超出部分将被截断并显示省略号。这里设置了 lines=1，所以只显示一行。")
                            fontSize(14f)
                            lines(1)
                            textOverFlowTail()
                            marginBottom(10f)
                            backgroundColor(Color(0x20000000))
                        }
                    }
                    Text {
                        attr {
                            text("这是一段很长的文本，用于测试行数限制功能。当文本内容超过指定的行数时，超出部分将被截断并显示省略号。这里设置了 lines=2，所以只显示两行。")
                            fontSize(14f)
                            lines(2)
                            textOverFlowTail()
                            backgroundColor(Color(0x20000000))
                        }
                    }
                }

                // ========== 6. textDecoration 文本装饰 ==========
                SectionHeader("6. textDecoration - 文本装饰")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("下划线 underline")
                            fontSize(16f)
                            textDecoration("underline")
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("删除线 line-through")
                            fontSize(16f)
                            textDecoration("line-through")
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("无装饰 none")
                            fontSize(16f)
                            textDecoration("none")
                        }
                    }
                }

                // ========== 7. letterSpacing 字间距 ==========
                SectionHeader("7. letterSpacing - 字间距")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("字间距 0 正常")
                            fontSize(14f)
                            letterSpacing(0f)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("字间距 2 稍宽")
                            fontSize(14f)
                            letterSpacing(2f)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("字间距 5 很宽")
                            fontSize(14f)
                            letterSpacing(5f)
                            marginBottom(8f)
                        }
                    }
                    Text {
                        attr {
                            text("字间距 10 超宽")
                            fontSize(14f)
                            letterSpacing(10f)
                        }
                    }
                }

                // ========== 8. lineHeight/lineSpacing ==========
                SectionHeader("8. lineHeight - 行高")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("行高1.0: 这是第一行\n这是第二行\n这是第三行")
                            fontSize(14f)
                            lineHeight(1.0f)
                            backgroundColor(Color(0x20000000))
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("行高1.5: 这是第一行\n这是第二行\n这是第三行")
                            fontSize(14f)
                            lineHeight(1.5f)
                            backgroundColor(Color(0x20000000))
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("行高2.0: 这是第一行\n这是第二行\n这是第三行")
                            fontSize(14f)
                            lineHeight(2.0f)
                            backgroundColor(Color(0x20000000))
                        }
                    }
                }

                // ========== 9. 富文本 Span ==========
                SectionHeader("9. RichText + Span - 富文本")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                        }
                        Span {
                            attr {
                                text("这是")
                            }
                        }
                        Span {
                            attr {
                                text("红色")
                                color(Color.RED)
                            }
                        }
                        Span {
                            attr {
                                text("和")
                            }
                        }
                        Span {
                            attr {
                                text("蓝色粗体")
                                color(Color.BLUE)
                                fontWeight700()
                            }
                        }
                        Span {
                            attr {
                                text("组合的富文本")
                            }
                        }
                    }
                    View {
                        attr {
                            height(10f)
                        }
                    }
                    RichText {
                        attr {
                            fontSize(14f)
                        }
                        Span {
                            attr {
                                text("大号")
                                fontSize(20f)
                            }
                        }
                        Span {
                            attr {
                                text("中号")
                                fontSize(14f)
                            }
                        }
                        Span {
                            attr {
                                text("小号")
                                fontSize(10f)
                            }
                        }
                        Span {
                            attr {
                                text(" 下划线")
                                textDecoration("underline")
                            }
                        }
                        Span {
                            attr {
                                text(" 删除线")
                                textDecoration("line-through")
                            }
                        }
                    }
                }

                // ========== 10. strokeWidth/strokeColor 描边 ==========
                SectionHeader("10. stroke - 文本描边")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFF333333))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("白色描边文字")
                            fontSize(24f)
                            color(Color(0xFF333333))
                            strokeWidth(1f)
                            strokeColor(Color.WHITE)
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("红色描边文字")
                            fontSize(24f)
                            color(Color.WHITE)
                            strokeWidth(2f)
                            strokeColor(Color.RED)
                            marginBottom(10f)
                        }
                    }
                    Text {
                        attr {
                            text("蓝色粗描边")
                            fontSize(28f)
                            color(Color.WHITE)
                            strokeWidth(3f)
                            strokeColor(Color.BLUE)
                        }
                    }
                }

                // ========== 11. 渐变文字 ==========
                SectionHeader("11. backgroundImage - 渐变文字")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("渐变色文字效果")
                            fontSize(28f)
                            fontWeight700()
                            backgroundImage(
                                BackgroundLinearGradient(
                                    direction = GradientDirection.TO_RIGHT,
                                    colors = listOf(Color(0xFF4A90E2), Color(0xFFFF6B6B), Color(0xFF50C878))
                                )
                            )
                        }
                    }
                }

                // ========== 12. headIndent 首行缩进 ==========
                SectionHeader("12. headIndent - 首行缩进")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("这是一段带有首行缩进的文本。首行缩进是排版中常用的格式，可以使段落更加清晰易读。这里设置了28像素的缩进，相当于两个汉字的宽度。")
                            fontSize(14f)
                            headIndent(28f)
                            lineHeight(1.5f)
                        }
                    }
                }

                // 底部占位
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    // 辅助方法：Section 标题
    private fun ViewContainer<*, *>.SectionHeader(title: String) {
        View {
            attr {
                padding(left = 10f, top = 15f, bottom = 5f)
            }
            Text {
                attr {
                    text(title)
                    fontSize(14f)
                    color(Color(0xFF333333))
                    fontWeight700()
                }
            }
        }
    }
}
