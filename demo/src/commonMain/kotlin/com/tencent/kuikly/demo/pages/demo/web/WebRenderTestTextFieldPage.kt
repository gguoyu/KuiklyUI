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
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRTextFieldView 全属性测试页面
 * 覆盖以下属性：
 * - text
 * - placeholder/placeholderColor
 * - textAlign
 * - fontSize/fontWeight
 * - tintColor (光标颜色)
 * - maxTextLength
 * - editable
 * - keyboardType (text/number/email/password)
 * - returnKeyType (search/send/done/go/next)
 * - 事件: textDidChange/inputFocus/inputBlur/inputReturn
 */
@Page("WebRenderTestTextField")
internal class WebRenderTestTextFieldPage : BasePager() {

    // 状态记录
    private var inputText1 by observable("")
    private var inputText2 by observable("")
    private var focusStatus by observable("未聚焦")
    private var changeCount by observable(0)
    private var returnCount by observable(0)

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
                        text("TextField组件属性测试")
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

                // ========== 1. 基础输入框 ==========
                SectionHeader("1. 基础 - text/placeholder")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("请输入文本...")
                            fontSize(16f)
                        }
                        event {
                            textDidChange { text ->
                                ctx.inputText1 = text
                            }
                        }
                    }
                    Text {
                        attr {
                            text("输入内容: ${ctx.inputText1}")
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
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("红色占位符")
                            placeholderColor(Color.RED)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("蓝色占位符")
                            placeholderColor(Color.BLUE)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
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
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("左对齐")
                            textAlign("left")
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("居中对齐")
                            textAlign("center")
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("右对齐")
                            textAlign("right")
                            fontSize(16f)
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
                    Input {
                        attr {
                            height(40f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("fontSize=12")
                            fontSize(12f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(50f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("fontSize=18 fontWeight=bold")
                            fontSize(18f)
                            fontWeight700()
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("fontSize=24")
                            fontSize(24f)
                        }
                    }
                }

                // ========== 5. maxTextLength ==========
                SectionHeader("5. maxTextLength - 最大长度限制")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("最多10个字符")
                            maxTextLength(10)
                            fontSize(16f)
                        }
                        event {
                            textDidChange { text ->
                                ctx.inputText2 = text
                            }
                        }
                    }
                    Text {
                        attr {
                            text("已输入: ${ctx.inputText2.length}/10")
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
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("可编辑")
                            editable(true)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color(0xFFCCCCCC))
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            text("不可编辑的内容")
                            editable(false)
                            fontSize(16f)
                        }
                    }
                }

                // ========== 7. keyboardType ==========
                SectionHeader("7. keyboardType - 键盘类型")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("默认键盘 (text)")
                            keyboardType("text")
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("数字键盘 (number)")
                            keyboardType("number")
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("邮箱键盘 (email)")
                            keyboardType("email")
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("密码输入 (password)")
                            keyboardType("password")
                            fontSize(16f)
                        }
                    }
                }

                // ========== 8. 事件回调 ==========
                SectionHeader("8. 事件回调")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("测试事件回调")
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
                            inputReturn {
                                ctx.returnCount++
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
                    Text {
                        attr {
                            text("回车次数: ${ctx.returnCount}")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginTop(4f)
                        }
                    }
                }

                // ========== 9. tintColor 光标颜色 ==========
                SectionHeader("9. tintColor - 光标颜色")
                View {
                    attr {
                        margin(10f)
                        padding(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("红色光标")
                            tintColor(Color.RED)
                            fontSize(16f)
                            marginBottom(10f)
                        }
                    }
                    Input {
                        attr {
                            height(44f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            padding(left = 10f, right = 10f)
                            placeholder("蓝色光标")
                            tintColor(Color.BLUE)
                            fontSize(16f)
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
