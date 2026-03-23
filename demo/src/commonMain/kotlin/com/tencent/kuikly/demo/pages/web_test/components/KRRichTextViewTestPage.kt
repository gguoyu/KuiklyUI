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
            }
        }
    }
}
