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

package com.tencent.kuikly.demo.pages.web_test.interactions

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.ActionSheet
import com.tencent.kuikly.core.views.AlertDialog
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Modal
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * 弹窗交互验证测试页面
 *
 * 测试覆盖：
 * 1. AlertDialog — 标准弹窗（标题+内容+按钮）
 * 2. ActionSheet — 底部操作菜单
 * 3. 自定义 Modal — 全屏自定义弹窗
 * 4. 弹窗交互结果 — 弹窗操作后的状态变化
 */
@Page("ModalTestPage")
internal class ModalTestPage : Pager() {

    // === 响应式状态 ===
    private var showAlert by observable(false)
    private var showActionSheet by observable(false)
    private var showCustomModal by observable(false)
    private var alertResult by observable("未操作")
    private var actionSheetResult by observable("未操作")
    private var customModalResult by observable("未操作")

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

                // === Section 1: AlertDialog 弹窗 ===
                Text {
                    attr {
                        text("1. AlertDialog 弹窗")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 触发按钮
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(0xFF2196F3)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showAlert = true
                        }
                    }
                    Text {
                        attr {
                            text("显示 Alert 弹窗")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // Alert 操作结果
                Text {
                    attr {
                        text("Alert 结果: ${ctx.alertResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 2: ActionSheet 底部菜单 ===
                Text {
                    attr {
                        text("2. ActionSheet 底部菜单")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 触发按钮
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(0xFF4CAF50)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showActionSheet = true
                        }
                    }
                    Text {
                        attr {
                            text("显示 ActionSheet")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // ActionSheet 操作结果
                Text {
                    attr {
                        text("ActionSheet 结果: ${ctx.actionSheetResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 3: 自定义 Modal 弹窗 ===
                Text {
                    attr {
                        text("3. 自定义 Modal 弹窗")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 触发按钮
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(44f)
                        backgroundColor(0xFFFF9800)
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            ctx.showCustomModal = true
                        }
                    }
                    Text {
                        attr {
                            text("显示自定义弹窗")
                            fontSize(16f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // 自定义 Modal 操作结果
                Text {
                    attr {
                        text("自定义弹窗结果: ${ctx.customModalResult}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                // === Section 4: 操作状态面板 ===
                Text {
                    attr {
                        text("4. 操作结果汇总")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        padding(all = 16f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }

                    Text {
                        attr {
                            text("Alert: ${ctx.alertResult}\n" +
                                 "ActionSheet: ${ctx.actionSheetResult}\n" +
                                 "自定义弹窗: ${ctx.customModalResult}")
                            fontSize(14f)
                            color(Color.BLACK)
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

            // =======================================
            // 弹窗组件（渲染在页面层级之上）
            // =======================================

            // Alert Dialog
            AlertDialog {
                attr {
                    showAlert(ctx.showAlert)
                    title("确认操作")
                    message("这是一个测试 Alert 弹窗，请选择操作。")
                    actionButtons("取消", "确定")
                }
                event {
                    clickActionButton { buttonIndex ->
                        ctx.showAlert = false
                        ctx.alertResult = if (buttonIndex == 0) "点击了取消" else "点击了确定"
                    }
                }
            }

            // ActionSheet
            ActionSheet {
                attr {
                    showActionSheet(ctx.showActionSheet)
                    descriptionOfActions("请选择一个操作")
                    actionButtons("取消", "拍照", "从相册选择", "从文件选择")
                }
                event {
                    clickActionButton { buttonIndex ->
                        ctx.showActionSheet = false
                        val actions = listOf("取消", "拍照", "从相册选择", "从文件选择")
                        ctx.actionSheetResult = "选择了: ${actions[buttonIndex]}"
                    }
                }
            }

            // 自定义 Modal
            if (ctx.showCustomModal) {
                Modal {
                    // 半透明背景
                    View {
                        attr {
                            absolutePosition(left = 0f, top = 0f, right = 0f, bottom = 0f)
                            backgroundColor(0x88000000)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.showCustomModal = false
                                ctx.customModalResult = "点击了背景关闭"
                            }
                        }

                        // 弹窗内容
                        View {
                            attr {
                                size(280f, 200f)
                                backgroundColor(Color.WHITE)
                                borderRadius(12f)
                                allCenter()
                            }
                            event {
                                click {
                                    // 阻止冒泡到背景
                                }
                            }

                            // 标题
                            Text {
                                attr {
                                    text("自定义弹窗")
                                    fontSize(18f)
                                    fontWeightBold()
                                    color(Color.BLACK)
                                    marginBottom(16f)
                                }
                            }

                            // 内容
                            Text {
                                attr {
                                    text("这是一个自定义的 Modal 弹窗内容")
                                    fontSize(14f)
                                    color(0xFF666666)
                                    marginBottom(24f)
                                    textAlignCenter()
                                }
                            }

                            // 确认按钮
                            View {
                                attr {
                                    width(120f)
                                    height(36f)
                                    backgroundColor(0xFF2196F3)
                                    borderRadius(18f)
                                    allCenter()
                                }
                                event {
                                    click {
                                        ctx.showCustomModal = false
                                        ctx.customModalResult = "点击了确认按钮"
                                    }
                                }
                                Text {
                                    attr {
                                        text("确认")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
