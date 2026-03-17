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
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRTextView 文本渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同字号
 * 2. 不同颜色
 * 3. 不同字重
 * 4. 文本对齐方式
 * 5. 多行文本与截断
 * 6. 文本装饰（下划线/删除线）
 * 7. 行高设置
 */
@Page("KRTextViewTestPage")
internal class KRTextViewTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 不同字号 ===
                Text {
                    attr {
                        text("1. 不同字号")
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
                    Text {
                        attr {
                            text("字号 10")
                            fontSize(10f)
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("字号 12")
                            fontSize(12f)
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("字号 14")
                            fontSize(14f)
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("字号 16")
                            fontSize(16f)
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("字号 20")
                            fontSize(20f)
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("字号 24")
                            fontSize(24f)
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                }

                // === Section 2: 不同颜色 ===
                Text {
                    attr {
                        text("2. 不同颜色")
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
                    Text {
                        attr {
                            text("红色文本")
                            fontSize(16f)
                            color(Color.RED)
                        }
                    }
                    Text {
                        attr {
                            text("蓝色文本")
                            fontSize(16f)
                            color(Color.BLUE)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("绿色文本")
                            fontSize(16f)
                            color(Color.GREEN)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("紫色文本")
                            fontSize(16f)
                            color(0xFF9C27B0)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("橙色文本")
                            fontSize(16f)
                            color(0xFFFF9800)
                            marginTop(4f)
                        }
                    }
                }

                // === Section 3: 不同字重 ===
                Text {
                    attr {
                        text("3. 不同字重")
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
                    Text {
                        attr {
                            text("普通字重")
                            fontSize(16f)
                            color(Color.BLACK)
                        }
                    }
                    Text {
                        attr {
                            text("中等字重 (Medium)")
                            fontSize(16f)
                            fontWeightMedium()
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("粗体字重 (Bold)")
                            fontSize(16f)
                            fontWeightBold()
                            color(Color.BLACK)
                            marginTop(4f)
                        }
                    }
                }

                // === Section 4: 文本对齐方式 ===
                Text {
                    attr {
                        text("4. 文本对齐方式")
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
                            marginTop(4f)
                        }
                        Text {
                            attr {
                                text("左对齐文本（默认）")
                                fontSize(14f)
                                color(Color.BLACK)
                                textAlignLeft()
                            }
                        }
                    }
                    View {
                        attr {
                            backgroundColor(0xFFF5F5F5)
                            padding(all = 8f)
                            marginTop(4f)
                        }
                        Text {
                            attr {
                                text("居中对齐文本")
                                fontSize(14f)
                                color(Color.BLACK)
                                textAlignCenter()
                            }
                        }
                    }
                    View {
                        attr {
                            backgroundColor(0xFFF5F5F5)
                            padding(all = 8f)
                            marginTop(4f)
                        }
                        Text {
                            attr {
                                text("右对齐文本")
                                fontSize(14f)
                                color(Color.BLACK)
                                textAlignRight()
                            }
                        }
                    }
                }

                // === Section 5: 多行文本与截断 ===
                Text {
                    attr {
                        text("5. 多行文本与截断")
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
                    // 多行文本（不限制行数）
                    View {
                        attr {
                            backgroundColor(0xFFF5F5F5)
                            padding(all = 8f)
                            marginTop(4f)
                        }
                        Text {
                            attr {
                                text("这是一段很长的多行文本，用于测试文本换行是否正确。Kuikly Web 渲染引擎需要正确处理文本的自动换行、行间距和溢出显示。这段文本应该能够自然地换行到多行显示。")
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 限制 2 行 + 省略号
                    View {
                        attr {
                            backgroundColor(0xFFE3F2FD)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        Text {
                            attr {
                                text("限制2行+省略号：这是一段很长的文本，超过两行后应该显示省略号。Kuikly Web 渲染引擎需要正确处理文本截断和省略号的显示效果。")
                                fontSize(14f)
                                color(Color.BLACK)
                                lines(2)
                                textOverFlowTail()
                            }
                        }
                    }
                    // 限制 1 行
                    View {
                        attr {
                            backgroundColor(0xFFFCE4EC)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        Text {
                            attr {
                                text("限制1行：这是一段很长的文本，应该只显示一行并带有省略号")
                                fontSize(14f)
                                color(Color.BLACK)
                                lines(1)
                                textOverFlowTail()
                            }
                        }
                    }
                }

                // === Section 6: 文本装饰 ===
                Text {
                    attr {
                        text("6. 文本装饰")
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
                    Text {
                        attr {
                            text("下划线文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            textDecorationUnderLine()
                        }
                    }
                    Text {
                        attr {
                            text("删除线文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            textDecorationLineThrough()
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("斜体文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            fontStyleItalic()
                            marginTop(8f)
                        }
                    }
                }

                // === Section 7: 行高 ===
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
                        Text {
                            attr {
                                text("行高16：这是测试行高的文本。第二行文本在这里，用于对比行间距的差异。")
                                fontSize(14f)
                                color(Color.BLACK)
                                lineHeight(16f)
                            }
                        }
                    }
                    View {
                        attr {
                            backgroundColor(0xFFE8F5E9)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        Text {
                            attr {
                                text("行高24：这是测试行高的文本。第二行文本在这里，用于对比行间距的差异。")
                                fontSize(14f)
                                color(Color.BLACK)
                                lineHeight(24f)
                            }
                        }
                    }
                    View {
                        attr {
                            backgroundColor(0xFFFFF3E0)
                            padding(all = 8f)
                            marginTop(8f)
                        }
                        Text {
                            attr {
                                text("行高32：这是测试行高的文本。第二行文本在这里，用于对比行间距的差异。")
                                fontSize(14f)
                                color(Color.BLACK)
                                lineHeight(32f)
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
