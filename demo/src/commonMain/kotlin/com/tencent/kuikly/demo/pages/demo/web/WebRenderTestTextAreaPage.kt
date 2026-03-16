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
import com.tencent.kuikly.core.base.ViewContainer
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.TextArea
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRTextAreaView 全属性测试页面
 * 覆盖多行输入组件属性：
 * - text
 * - placeholder/placeholderColor
 * - textAlign
 * - fontSize/fontWeight
 * - maxTextLength
 * - editable
 * - 事件: textDidChange/inputFocus/inputBlur
 */
@Page("WebRenderTestTextArea")
internal class WebRenderTestTextAreaPage : BasePager() {

    // 状态记录
    private var textAreaContent by observable("")
    private var focusStatus by observable("未聚焦")
    private var changeCount by observable(0)

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
                        text("TextArea组件属性测试")
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

                // ========== 1. 基础多行输入 ==========
                SectionHeader("1. 基础多行输入")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(120f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("请输入多行文本...")
                            fontSize(16f)
                        }
                        event {
                            textDidChange { text ->
                                ctx.textAreaContent = text
                            }
                        }
                    }
                    Text {
                        attr {
                            text("已输入 ${ctx.textAreaContent.length} 个字符")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginTop(8f)
                        }
                    }
                }

                // ========== 2. placeholderColor ==========
                SectionHeader("2. placeholderColor - 占位符颜色")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("红色占位符")
                            placeholderColor(Color.RED)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("绿色占位符")
                            placeholderColor(Color(0xFF50C878))
                            fontSize(16f)
                        }
                    }
                }

                // ========== 3. textAlign ==========
                SectionHeader("3. textAlign - 文本对齐")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("左对齐")
                            textAlign("left")
                            fontSize(14f)
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("居中对齐")
                            textAlign("center")
                            fontSize(14f)
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("右对齐")
                            textAlign("right")
                            fontSize(14f)
                        }
                    }
                }

                // ========== 4. fontSize/fontWeight ==========
                SectionHeader("4. fontSize/fontWeight")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("fontSize=12 细体")
                            fontSize(12f)
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(70f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("fontSize=18 粗体")
                            fontSize(18f)
                            fontWeight700()
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("fontSize=24 大号")
                            fontSize(24f)
                        }
                    }
                }

                // ========== 5. maxTextLength ==========
                SectionHeader("5. maxTextLength - 最大长度")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(100f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("最多输入50个字符")
                            maxTextLength(50)
                            fontSize(16f)
                        }
                    }
                    Text {
                        attr {
                            text("限制: 50个字符")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginTop(8f)
                        }
                    }
                }

                // ========== 6. editable ==========
                SectionHeader("6. editable - 是否可编辑")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("可编辑的文本域")
                            editable(true)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    TextArea {
                        attr {
                            height(80f)
                            backgroundColor(Color(0xFFCCCCCC))
                            borderRadius(8f)
                            padding(10f)
                            text("这是不可编辑的内容\n第二行内容")
                            editable(false)
                            fontSize(16f)
                        }
                    }
                }

                // ========== 7. 事件回调 ==========
                SectionHeader("7. 事件回调")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(100f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            placeholder("测试事件回调...")
                            fontSize(16f)
                        }
                        event {
                            textDidChange { _ ->
                                ctx.changeCount++
                            }
                            inputFocus {
                                ctx.focusStatus = "已聚焦"
                            }
                            inputBlur {
                                ctx.focusStatus = "已失焦"
                            }
                        }
                    }
                    Text {
                        attr {
                            text("聚焦状态: ${ctx.focusStatus}")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("内容变化次数: ${ctx.changeCount}")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginTop(4f)
                        }
                    }
                }

                // ========== 8. 预设内容 ==========
                SectionHeader("8. 预设内容")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    TextArea {
                        attr {
                            height(120f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(10f)
                            text("这是预设的多行文本内容。\n\n第二段落开始...\n可以包含多行文字。")
                            fontSize(14f)
                        }
                    }
                }

                // 底部占位
                View {
                    attr {
                        height(100f)
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
