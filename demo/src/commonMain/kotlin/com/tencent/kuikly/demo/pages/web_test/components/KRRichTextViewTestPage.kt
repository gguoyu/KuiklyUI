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

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.ImageSpan
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.RichText
import com.tencent.kuikly.core.views.Span
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRRichTextView 富文本渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 多色多样式 Span 组合
 * 2. 粗体/斜体/中等字重
 * 3. 下划线/删除线装饰
 * 4. 不同字号混排
 * 5. ImageSpan 图文混排
 * 6. 多行富文本与截断
 * 7. 行高设置
 */
@Page("KRRichTextViewTestPage")
internal class KRRichTextViewTestPage : Pager() {

    companion object {
        const val TEST_IMAGE_URL = "https://vfiles.gtimg.cn/wuji_dashboard/xy/componenthub/Dfnp7Q9F.png"
    }

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 多色多样式 Span 组合 ===
                Text {
                    attr {
                        text("1. 多色多样式Span")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("普通文本")
                        }
                        Span {
                            color(Color.RED)
                            text("红色文本")
                        }
                        Span {
                            color(Color.BLUE)
                            text("蓝色文本")
                        }
                        Span {
                            color(Color(0xFF4CAF50))
                            text("绿色文本")
                        }
                        Span {
                            color(Color(0xFFFF9800))
                            text("橙色文本")
                        }
                    }
                }

                // === Section 2: 粗体/斜体/中等字重 ===
                Text {
                    attr {
                        text("2. 字重与字体样式")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("普通字重 ")
                        }
                        Span {
                            fontWeightMedium()
                            text("中等字重 ")
                        }
                        Span {
                            fontWeightBold()
                            text("粗体字重 ")
                        }
                        Span {
                            fontStyleItalic()
                            text("斜体文本")
                        }
                    }
                }

                // === Section 3: 下划线/删除线装饰 ===
                Text {
                    attr {
                        text("3. 文本装饰")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("普通文本 ")
                        }
                        Span {
                            textDecorationUnderLine()
                            text("下划线文本 ")
                        }
                        Span {
                            textDecorationLineThrough()
                            text("删除线文本 ")
                        }
                        Span {
                            textDecorationUnderLine()
                            fontWeightBold()
                            color(Color.RED)
                            text("粗体红色下划线")
                        }
                    }
                }

                // === Section 4: 不同字号混排 ===
                Text {
                    attr {
                        text("4. 不同字号混排")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            color(Color.BLACK)
                        }
                        Span {
                            fontSize(10f)
                            text("10号字 ")
                        }
                        Span {
                            fontSize(14f)
                            text("14号字 ")
                        }
                        Span {
                            fontSize(18f)
                            text("18号字 ")
                        }
                        Span {
                            fontSize(22f)
                            text("22号字 ")
                        }
                        Span {
                            fontSize(28f)
                            text("28号字")
                        }
                    }
                }

                // === Section 5: ImageSpan 图文混排 ===
                Text {
                    attr {
                        text("5. 图文混排ImageSpan")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("文本前嵌入图片 ")
                        }
                        ImageSpan {
                            size(30f, 30f)
                            src(TEST_IMAGE_URL)
                            borderRadius(4f)
                        }
                        Span {
                            text(" 文本中嵌入图片 ")
                        }
                        ImageSpan {
                            size(40f, 40f)
                            src(TEST_IMAGE_URL)
                            borderRadius(20f)
                        }
                        Span {
                            text(" 图片后文本")
                        }
                    }
                }

                // === Section 6: 多行富文本与截断 ===
                Text {
                    attr {
                        text("6. 多行与截断")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    // 多行不限制
                    View {
                        attr {
                            backgroundColor(0xFFF5F5F5)
                            padding(all = 8f)
                        }
                        RichText {
                            attr {
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                            Span {
                                text("这是一段很长的")
                            }
                            Span {
                                color(Color.RED)
                                fontWeightBold()
                                text("富文本内容")
                            }
                            Span {
                                text("，包含多种样式混排。当文本超过容器宽度时应该自动换行。Kuikly Web渲染引擎需要正确处理富文本的自动换行和行间距显示效果。")
                            }
                        }
                    }
                    // 限制2行+省略号
                    View {
                        attr {
                            backgroundColor(0xFFE3F2FD)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        RichText {
                            attr {
                                fontSize(14f)
                                color(Color.BLACK)
                                lines(2)
                                textOverFlowTail()
                            }
                            Span {
                                text("限制2行省略号：这是一段很长的")
                            }
                            Span {
                                color(Color.BLUE)
                                fontWeightBold()
                                text("蓝色粗体富文本")
                            }
                            Span {
                                text("，超过两行后应该显示省略号。Kuikly Web渲染引擎需要正确处理富文本截断和省略号的显示效果。这段文本应该足够长来触发截断。")
                            }
                        }
                    }
                }

                // === Section 7: 行高设置 ===
                Text {
                    attr {
                        text("7. 行高设置")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    View {
                        attr {
                            backgroundColor(0xFFF5F5F5)
                            padding(all = 8f)
                        }
                        RichText {
                            attr {
                                fontSize(14f)
                                color(Color.BLACK)
                                lineHeight(18f)
                            }
                            Span {
                                text("行高18：")
                            }
                            Span {
                                color(Color.RED)
                                text("红色文本混排，第二行文本在这里，用于对比不同行高的差异效果。")
                            }
                        }
                    }
                    View {
                        attr {
                            backgroundColor(0xFFE8F5E9)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        RichText {
                            attr {
                                fontSize(14f)
                                color(Color.BLACK)
                                lineHeight(28f)
                            }
                            Span {
                                text("行高28：")
                            }
                            Span {
                                color(Color.BLUE)
                                text("蓝色文本混排，第二行文本在这里，用于对比不同行高的差异效果。")
                            }
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(50f)
                    }
                }

                // === Section 8: 行截断与 lineBreakMode ===
                Text {
                    attr {
                        text("8. 行截断与文本属性")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // numberOfLines=1 with textOverFlowTail
                Text {
                    attr {
                        text("单行截断（tail）: 这是一段超长文本用于测试单行截断效果，文本会被截断并显示省略号。")
                        fontSize(14f)
                        color(Color.BLACK)
                        lines(1)
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                        textOverFlowTail()
                    }
                }

                // numberOfLines=2
                Text {
                    attr {
                        text("多行截断（2行）: 这是一段超长文本用于测试多行截断效果，文本会显示最多两行然后被截断，超出部分不可见。继续添加更多内容。")
                        fontSize(14f)
                        color(Color.BLACK)
                        lines(2)
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                    }
                }

                // wordWrapping lineBreakMode
                Text {
                    attr {
                        text("wordWrapping: word-wrap-mode-text")
                        fontSize(14f)
                        color(Color.BLACK)
                        textOverFlowWordWrapping()
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                    }
                }

                // firstLineHeadIndent
                Text {
                    attr {
                        text("首行缩进: 这是一段带有首行缩进的文本，第一行开头有额外的缩进距离，后续行不缩进。")
                        fontSize(14f)
                        color(Color.BLACK)
                        firstLineHeadIndent(24f)
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                    }
                }

                // === Section 9: 间距与字体家族 ===
                Text {
                    attr {
                        text("9. 间距与字体")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // letterSpacing
                Text {
                    attr {
                        text("letter-spacing-text")
                        fontSize(16f)
                        color(Color(0xFF1565C0))
                        letterSpacing(2f)
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                // lineSpacing
                Text {
                    attr {
                        text("lineSpacing: 行间距文本\n第二行文本\n第三行文本")
                        fontSize(14f)
                        color(Color.BLACK)
                        lineSpacing(2.0f)
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                    }
                }

                // fontStyleItalic
                Text {
                    attr {
                        text("italic-style-text")
                        fontSize(16f)
                        color(Color(0xFF1976D2))
                        fontStyleItalic()
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                // fontFamily
                Text {
                    attr {
                        text("fontFamily-text")
                        fontSize(16f)
                        color(Color(0xFF4CAF50))
                        fontFamily("monospace")
                        marginTop(8f)
                        marginLeft(16f)
                    }
                }

                // textAlignCenter
                Text {
                    attr {
                        text("center-aligned-text")
                        fontSize(16f)
                        color(Color(0xFFE53935))
                        textAlignCenter()
                        marginTop(8f)
                        marginLeft(16f)
                        marginRight(16f)
                    }
                }

                // === Section 10: Span-Level Text Effects ===
                Text {
                    attr {
                        text("10. Span Text Effects")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                        Span {
                            text("shadow ")
                            textShadow(2f, 2f, 3f, Color(0xFF999999))
                        }
                        Span {
                            text("stroke ")
                            textStroke(Color.RED, 1f)
                        }
                        Span {
                            text("spacing ")
                            letterSpacing(3f)
                        }
                        Span {
                            text("lineHeight")
                            lineHeight(24f)
                        }
                    }
                }

                // === Section 11: Gradient Text ===
                Text {
                    attr {
                        text("11. Gradient Text")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(left = 16f, top = 8f, right = 16f, bottom = 8f)
                    }
                    RichText {
                        attr {
                            fontSize(24f)
                            fontWeightBold()
                            backgroundLinearGradient(Direction.TO_RIGHT, ColorStop(Color.RED, 0f), ColorStop(Color(0xFF0000FF), 1f))
                        }
                        Span {
                            text("gradient-text")
                        }
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
