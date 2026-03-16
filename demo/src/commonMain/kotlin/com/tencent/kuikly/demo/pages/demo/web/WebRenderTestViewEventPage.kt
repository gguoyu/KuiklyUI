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
import com.tencent.kuikly.core.base.event.PanGestureParams
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRView 事件属性全覆盖测试页面
 * 覆盖以下事件：
 * - click 点击
 * - doubleClick 双击
 * - longPress 长按
 * - pan 拖拽手势 (start/move/end)
 * - touchDown 触摸开始
 * - touchMove 触摸移动
 * - touchUp 触摸结束
 */
@Page("WebRenderTestViewEvent")
internal class WebRenderTestViewEventPage : BasePager() {

    // 事件状态记录
    private var clickCount by observable(0)
    private var doubleClickCount by observable(0)
    private var longPressCount by observable(0)
    private var panState by observable("idle")
    private var panPosition by observable("x:0, y:0")
    private var touchDownCount by observable(0)
    private var touchMoveCount by observable(0)
    private var touchUpCount by observable(0)
    private var touchPosition by observable("x:0, y:0")

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
                        text("View事件属性测试")
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

                // ========== 1. click 点击事件 ==========
                SectionHeader("1. click - 点击事件")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        alignItemsCenter()
                        padding(10f)
                    }
                    View {
                        attr {
                            size(120f, 80f)
                            backgroundColor(Color(0xFF4A90E2))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.clickCount++
                            }
                        }
                        Text {
                            attr {
                                text("点击我")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            marginLeft(15f)
                        }
                        Text {
                            attr {
                                text("点击次数: ${ctx.clickCount}")
                                fontSize(16f)
                                color(Color(0xFF333333))
                            }
                        }
                    }
                }

                // ========== 2. doubleClick 双击事件 ==========
                SectionHeader("2. doubleClick - 双击事件")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        alignItemsCenter()
                        padding(10f)
                    }
                    View {
                        attr {
                            size(120f, 80f)
                            backgroundColor(Color(0xFF50C878))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            doubleClick {
                                ctx.doubleClickCount++
                            }
                        }
                        Text {
                            attr {
                                text("双击我")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            marginLeft(15f)
                        }
                        Text {
                            attr {
                                text("双击次数: ${ctx.doubleClickCount}")
                                fontSize(16f)
                                color(Color(0xFF333333))
                            }
                        }
                    }
                }

                // ========== 3. longPress 长按事件 ==========
                SectionHeader("3. longPress - 长按事件")
                View {
                    attr {
                        height(100f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        alignItemsCenter()
                        padding(10f)
                    }
                    View {
                        attr {
                            size(120f, 80f)
                            backgroundColor(Color(0xFFFF6B6B))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            longPress {
                                ctx.longPressCount++
                            }
                        }
                        Text {
                            attr {
                                text("长按我")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            marginLeft(15f)
                        }
                        Text {
                            attr {
                                text("长按次数: ${ctx.longPressCount}")
                                fontSize(16f)
                                color(Color(0xFF333333))
                            }
                        }
                        Text {
                            attr {
                                text("(按住700ms触发)")
                                fontSize(12f)
                                color(Color(0xFF999999))
                                marginTop(5f)
                            }
                        }
                    }
                }

                // ========== 4. pan 拖拽手势 ==========
                SectionHeader("4. pan - 拖拽手势")
                View {
                    attr {
                        height(180f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            marginBottom(10f)
                        }
                        Text {
                            attr {
                                text("状态: ${ctx.panState}")
                                fontSize(14f)
                                color(Color(0xFF333333))
                                marginRight(20f)
                            }
                        }
                        Text {
                            attr {
                                text("位置: ${ctx.panPosition}")
                                fontSize(14f)
                                color(Color(0xFF333333))
                            }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFF9B59B6))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            pan { params ->
                                val gestureParams = params as PanGestureParams
                                ctx.panState = gestureParams.state
                                ctx.panPosition = "x:${gestureParams.pageX.toInt()}, y:${gestureParams.pageY.toInt()}"
                            }
                        }
                        Text {
                            attr {
                                text("在此区域拖拽")
                                fontSize(16f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // ========== 5. touchDown/touchMove/touchUp ==========
                SectionHeader("5. touch系列 - 触摸事件")
                View {
                    attr {
                        height(200f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        padding(10f)
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            flexWrapWrap()
                            marginBottom(10f)
                        }
                        Text {
                            attr {
                                text("touchDown: ${ctx.touchDownCount}")
                                fontSize(12f)
                                color(Color(0xFF333333))
                                marginRight(10f)
                            }
                        }
                        Text {
                            attr {
                                text("touchMove: ${ctx.touchMoveCount}")
                                fontSize(12f)
                                color(Color(0xFF333333))
                                marginRight(10f)
                            }
                        }
                        Text {
                            attr {
                                text("touchUp: ${ctx.touchUpCount}")
                                fontSize(12f)
                                color(Color(0xFF333333))
                            }
                        }
                    }
                    Text {
                        attr {
                            text("触摸位置: ${ctx.touchPosition}")
                            fontSize(12f)
                            color(Color(0xFF666666))
                            marginBottom(10f)
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFE67E22))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            touchDown { params ->
                                ctx.touchDownCount++
                                val x = params.optDouble("x", 0.0).toInt()
                                val y = params.optDouble("y", 0.0).toInt()
                                ctx.touchPosition = "x:$x, y:$y"
                            }
                            touchMove { params ->
                                ctx.touchMoveCount++
                                val x = params.optDouble("x", 0.0).toInt()
                                val y = params.optDouble("y", 0.0).toInt()
                                ctx.touchPosition = "x:$x, y:$y"
                            }
                            touchUp { params ->
                                ctx.touchUpCount++
                                val x = params.optDouble("x", 0.0).toInt()
                                val y = params.optDouble("y", 0.0).toInt()
                                ctx.touchPosition = "x:$x, y:$y"
                            }
                        }
                        Text {
                            attr {
                                text("触摸此区域")
                                fontSize(16f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // ========== 6. 组合事件测试 ==========
                SectionHeader("6. 组合事件测试")
                View {
                    attr {
                        height(120f)
                        margin(10f)
                        backgroundColor(Color(0xFFEEEEEE))
                        borderRadius(8f)
                        flexDirectionRow()
                        justifyContentSpaceEvenly()
                        alignItemsCenter()
                    }
                    // 同时绑定 click 和 longPress
                    View {
                        attr {
                            size(100f, 80f)
                            backgroundColor(Color(0xFF3498DB))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.clickCount++
                            }
                            longPress {
                                ctx.longPressCount++
                            }
                        }
                        Text {
                            attr {
                                text("click+\nlongPress")
                                fontSize(11f)
                                color(Color.WHITE)
                                textAlign("center")
                            }
                        }
                    }
                    // 同时绑定 click 和 doubleClick
                    View {
                        attr {
                            size(100f, 80f)
                            backgroundColor(Color(0xFF1ABC9C))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click {
                                ctx.clickCount++
                            }
                            doubleClick {
                                ctx.doubleClickCount++
                            }
                        }
                        Text {
                            attr {
                                text("click+\ndoubleClick")
                                fontSize(11f)
                                color(Color.WHITE)
                                textAlign("center")
                            }
                        }
                    }
                }

                // 底部状态汇总
                SectionHeader("事件统计")
                View {
                    attr {
                        margin(10f)
                        padding(15f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("click: ${ctx.clickCount} | doubleClick: ${ctx.doubleClickCount} | longPress: ${ctx.longPressCount}")
                            fontSize(14f)
                            color(Color(0xFF333333))
                        }
                    }
                    Text {
                        attr {
                            text("touchDown: ${ctx.touchDownCount} | touchMove: ${ctx.touchMoveCount} | touchUp: ${ctx.touchUpCount}")
                            fontSize(14f)
                            color(Color(0xFF333333))
                            marginTop(8f)
                        }
                    }
                    Text {
                        attr {
                            text("pan状态: ${ctx.panState}")
                            fontSize(14f)
                            color(Color(0xFF333333))
                            marginTop(8f)
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
