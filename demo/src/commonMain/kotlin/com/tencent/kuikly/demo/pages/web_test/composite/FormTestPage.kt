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

package com.tencent.kuikly.demo.pages.web_test.composite

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.Input
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * 组合场景测试：表单场景
 *
 * 验证多组件协同：多输入框 + 开关 + 提交按钮 + 表单验证
 *
 * 测试覆盖：
 * 1. 姓名输入框 — 必填项验证
 * 2. 邮箱输入框 — 格式校验
 * 3. 手机号输入框 — 数字键盘
 * 4. 备注输入框 — 多行文本
 * 5. 订阅开关 — 布尔值切换
 * 6. 协议同意开关 — 布尔值切换
 * 7. 提交按钮 — 校验所有字段后展示结果
 * 8. 重置按钮 — 清空所有字段
 */
@Page("FormTestPage")
internal class FormTestPage : Pager() {

    // === 表单字段状态 ===
    private var nameValue by observable("")
    private var emailValue by observable("")
    private var phoneValue by observable("")
    private var noteValue by observable("")
    private var subscribeEnabled by observable(false)
    private var agreeTerms by observable(false)

    // === 提交反馈状态 ===
    private var submitResult by observable("")
    private var hasSubmitted by observable(false)

    // === 校验错误状态 ===
    private var nameError by observable("")
    private var emailError by observable("")

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
                Text {
                    attr {
                        text("用户信息表单")
                        fontSize(20f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                Text {
                    attr {
                        text("请填写以下信息，带 * 为必填项")
                        fontSize(13f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF999999)
                        marginBottom(8f)
                    }
                }

                // === 分隔线 ===
                View {
                    attr {
                        height(0.5f)
                        backgroundColor(0xFFEEEEEE)
                        marginBottom(16f)
                    }
                }

                // === 姓名输入 ===
                Text {
                    attr {
                        text("* 姓名")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(
                            Border(
                                1f, BorderStyle.SOLID,
                                if (ctx.nameError.isNotEmpty()) Color(0xFFE53935) else Color(0xFFDDDDDD)
                            )
                        )
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入姓名")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.nameValue = params.text
                                ctx.nameError = if (params.text.isBlank()) "姓名不能为空" else ""
                            }
                        }
                    }
                }

                if (ctx.nameError.isNotEmpty()) {
                    Text {
                        attr {
                            text(ctx.nameError)
                            fontSize(12f)
                            marginTop(4f)
                            marginLeft(16f)
                            color(Color(0xFFE53935))
                        }
                    }
                }

                // === 邮箱输入 ===
                Text {
                    attr {
                        text("* 邮箱")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(
                            Border(
                                1f, BorderStyle.SOLID,
                                if (ctx.emailError.isNotEmpty()) Color(0xFFE53935) else Color(0xFFDDDDDD)
                            )
                        )
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入邮箱地址")
                            placeholderColor(Color(0xFF999999))
                        }
                        event {
                            textDidChange { params ->
                                ctx.emailValue = params.text
                                ctx.emailError = when {
                                    params.text.isBlank() -> "邮箱不能为空"
                                    !params.text.contains("@") -> "请输入有效的邮箱格式"
                                    else -> ""
                                }
                            }
                        }
                    }
                }

                if (ctx.emailError.isNotEmpty()) {
                    Text {
                        attr {
                            text(ctx.emailError)
                            fontSize(12f)
                            marginTop(4f)
                            marginLeft(16f)
                            color(Color(0xFFE53935))
                        }
                    }
                }

                // === 手机号输入 ===
                Text {
                    attr {
                        text("手机号")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(44f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            height(42f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("请输入手机号（选填）")
                            placeholderColor(Color(0xFF999999))
                            keyboardTypeNumber()
                            maxTextLength(11)
                        }
                        event {
                            textDidChange { params ->
                                ctx.phoneValue = params.text
                            }
                        }
                    }
                }

                // === 备注输入 ===
                Text {
                    attr {
                        text("备注")
                        fontSize(14f)
                        fontWeightBold()
                        marginLeft(16f)
                        marginTop(16f)
                        marginBottom(6f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f)
                        height(80f)
                        border(Border(1f, BorderStyle.SOLID, Color(0xFFDDDDDD)))
                        borderRadius(8f)
                        padding(left = 12f, right = 12f, top = 8f)
                        backgroundColor(Color.WHITE)
                    }
                    Input {
                        attr {
                            flex(1f)
                            fontSize(15f)
                            color(Color.BLACK)
                            placeholder("备注信息（选填）")
                            placeholderColor(Color(0xFF999999))
                            maxTextLength(200)
                        }
                        event {
                            textDidChange { params ->
                                ctx.noteValue = params.text
                            }
                        }
                    }
                }

                // === 开关项 1: 订阅邮件 ===
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        margin(left = 16f, right = 16f, top = 20f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("订阅产品更新邮件")
                            fontSize(14f)
                            flex(1f)
                            color(Color.BLACK)
                        }
                    }
                    View {
                        attr {
                            size(52f, 28f)
                            backgroundColor(
                                if (ctx.subscribeEnabled) Color(0xFF4CAF50) else Color(0xFFCCCCCC)
                            )
                            borderRadius(14f)
                        }
                        event {
                            click {
                                ctx.subscribeEnabled = !ctx.subscribeEnabled
                            }
                        }
                        View {
                            attr {
                                size(24f, 24f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                marginTop(2f)
                                marginLeft(if (ctx.subscribeEnabled) 26f else 2f)
                            }
                        }
                    }
                }

                // === 开关项 2: 同意协议 ===
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        margin(left = 16f, right = 16f, top = 12f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("我已阅读并同意用户协议")
                            fontSize(14f)
                            flex(1f)
                            color(Color.BLACK)
                        }
                    }
                    View {
                        attr {
                            size(52f, 28f)
                            backgroundColor(
                                if (ctx.agreeTerms) Color(0xFF2196F3) else Color(0xFFCCCCCC)
                            )
                            borderRadius(14f)
                        }
                        event {
                            click {
                                ctx.agreeTerms = !ctx.agreeTerms
                            }
                        }
                        View {
                            attr {
                                size(24f, 24f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                marginTop(2f)
                                marginLeft(if (ctx.agreeTerms) 26f else 2f)
                            }
                        }
                    }
                }

                // === 提交结果展示 ===
                if (ctx.hasSubmitted && ctx.submitResult.isNotEmpty()) {
                    View {
                        attr {
                            margin(left = 16f, right = 16f, top = 16f)
                            padding(all = 12f)
                            backgroundColor(0xFFE8F5E9)
                            borderRadius(8f)
                        }
                        Text {
                            attr {
                                text(ctx.submitResult)
                                fontSize(13f)
                                color(Color(0xFF2E7D32))
                            }
                        }
                    }
                }

                // === 操作按钮区 ===
                View {
                    attr {
                        flexDirectionRow()
                        margin(left = 16f, right = 16f, top = 24f)
                    }

                    // 重置按钮
                    View {
                        attr {
                            flex(1f)
                            height(48f)
                            backgroundColor(0xFFEEEEEE)
                            borderRadius(8f)
                            allCenter()
                            marginRight(8f)
                        }
                        event {
                            click {
                                ctx.nameValue = ""
                                ctx.emailValue = ""
                                ctx.phoneValue = ""
                                ctx.noteValue = ""
                                ctx.subscribeEnabled = false
                                ctx.agreeTerms = false
                                ctx.submitResult = ""
                                ctx.hasSubmitted = false
                                ctx.nameError = ""
                                ctx.emailError = ""
                            }
                        }
                        Text {
                            attr {
                                text("重置")
                                fontSize(16f)
                                color(0xFF666666)
                                fontWeightBold()
                            }
                        }
                    }

                    // 提交按钮
                    View {
                        attr {
                            flex(2f)
                            height(48f)
                            backgroundColor(
                                if (ctx.agreeTerms) Color(0xFF2196F3) else Color(0xFFBBBBBB)
                            )
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                // 校验必填项
                                var valid = true
                                if (ctx.nameValue.isBlank()) {
                                    ctx.nameError = "姓名不能为空"
                                    valid = false
                                }
                                if (ctx.emailValue.isBlank()) {
                                    ctx.emailError = "邮箱不能为空"
                                    valid = false
                                } else if (!ctx.emailValue.contains("@")) {
                                    ctx.emailError = "请输入有效的邮箱格式"
                                    valid = false
                                }
                                if (!ctx.agreeTerms) {
                                    valid = false
                                }
                                if (valid) {
                                    ctx.submitResult = "提交成功！\n" +
                                        "姓名: ${ctx.nameValue}\n" +
                                        "邮箱: ${ctx.emailValue}\n" +
                                        (if (ctx.phoneValue.isNotEmpty()) "手机: ${ctx.phoneValue}\n" else "") +
                                        "订阅邮件: ${if (ctx.subscribeEnabled) "是" else "否"}"
                                    ctx.hasSubmitted = true
                                }
                            }
                        }
                        Text {
                            attr {
                                text("提交表单")
                                fontSize(16f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(60f)
                    }
                }
            }
        }
    }
}
