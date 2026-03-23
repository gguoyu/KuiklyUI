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

package com.tencent.kuikly.demo.pages.web_test.animations

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.timer.setTimeout
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * JS 帧动画验证测试页面
 *
 * 测试覆盖（使用 setTimeout 驱动逐帧状态变化，模拟帧动画效果）：
 * 1. 进度条动画 — 每帧递增进度值，宽度从 0 增长到满
 * 2. 跑马灯动画 — 方块在轨道中逐帧移动
 * 3. 颜色轮播动画 — 定时切换背景色模拟帧动画
 * 4. 计数器动画 — 快速数字递增效果
 */
@Page("JSFrameAnimTestPage")
internal class JSFrameAnimTestPage : Pager() {

    // === 进度条动画状态 ===
    private var progressValue by observable(0)         // 0~100
    private var progressRunning by observable(false)

    // === 跑马灯动画状态 ===
    private var marqueePosIndex by observable(0)       // 0~5，对应6个离散位置
    private var marqueeRunning by observable(false)

    // === 颜色轮播状态 ===
    private val colorList = listOf(
        Color(0xFF2196F3),
        Color(0xFF4CAF50),
        Color(0xFFFF5722),
        Color(0xFF9C27B0),
        Color(0xFFFF9800)
    )
    private var colorIndex by observable(0)
    private var colorRunning by observable(false)

    // === 计数器动画状态 ===
    private var countValue by observable(0)
    private var countRunning by observable(false)

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

                // === Section 1: 进度条动画 ===
                Text {
                    attr {
                        text("1. 进度条帧动画")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 进度条轨道
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(20f)
                        backgroundColor(0xFFE0E0E0)
                        borderRadius(10f)
                    }
                    // 进度填充
                    View {
                        attr {
                            height(20f)
                            // 进度百分比对应宽度，最大宽度约 343（375 - 32 margin）
                            width(343f * ctx.progressValue / 100f)
                            backgroundColor(Color(0xFF2196F3))
                            borderRadius(10f)
                        }
                    }
                }

                Text {
                    attr {
                        text("进度: ${ctx.progressValue}%")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(
                            if (ctx.progressRunning) Color(0xFFCCCCCC) else Color(0xFF2196F3)
                        )
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            if (!ctx.progressRunning) {
                                ctx.progressValue = 0
                                ctx.progressRunning = true
                                // 用 setTimeout 递归驱动逐帧递增，模拟帧动画
                                fun tick() {
                                    if (ctx.progressValue < 100) {
                                        ctx.progressValue += 5
                                        ctx.setTimeout(50) { tick() }
                                    } else {
                                        ctx.progressRunning = false
                                    }
                                }
                                tick()
                            }
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.progressRunning) "运行中..." else "开始动画")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 2: 跑马灯动画 ===
                Text {
                    attr {
                        text("2. 跑马灯帧动画")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // 轨道
                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 12f)
                        height(60f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    // 跑马灯方块，离散位置：index * 50f
                    View {
                        attr {
                            size(50f, 44f)
                            backgroundColor(Color(0xFFFF5722))
                            borderRadius(6f)
                            absolutePosition(top = 8f, left = ctx.marqueePosIndex * 50f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("▶")
                                fontSize(16f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(
                            if (ctx.marqueeRunning) Color(0xFFCCCCCC) else Color(0xFFFF5722)
                        )
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            if (!ctx.marqueeRunning) {
                                ctx.marqueePosIndex = 0
                                ctx.marqueeRunning = true
                                fun step() {
                                    if (ctx.marqueePosIndex < 5) {
                                        ctx.marqueePosIndex += 1
                                        ctx.setTimeout(150) { step() }
                                    } else {
                                        ctx.marqueeRunning = false
                                    }
                                }
                                step()
                            }
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.marqueeRunning) "运行中..." else "开始跑马灯")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 3: 颜色轮播动画 ===
                Text {
                    attr {
                        text("3. 颜色轮播帧动画")
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
                        height(60f)
                        backgroundColor(ctx.colorList[ctx.colorIndex])
                        borderRadius(8f)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("颜色轮播区域")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                Text {
                    attr {
                        text("当前色块: ${ctx.colorIndex + 1} / ${ctx.colorList.size}")
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF666666)
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(
                            if (ctx.colorRunning) Color(0xFFCCCCCC) else Color(0xFF9C27B0)
                        )
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            if (!ctx.colorRunning) {
                                ctx.colorIndex = 0
                                ctx.colorRunning = true
                                fun nextColor() {
                                    if (ctx.colorIndex < ctx.colorList.size - 1) {
                                        ctx.colorIndex += 1
                                        ctx.setTimeout(300) { nextColor() }
                                    } else {
                                        ctx.colorRunning = false
                                    }
                                }
                                nextColor()
                            }
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.colorRunning) "轮播中..." else "开始轮播")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
                        }
                    }
                }

                // === Section 4: 数字递增动画 ===
                Text {
                    attr {
                        text("4. 数字递增帧动画")
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
                        height(80f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                        allCenter()
                    }
                    Text {
                        attr {
                            text("${ctx.countValue}")
                            fontSize(48f)
                            fontWeightBold()
                            color(Color(0xFF2196F3))
                        }
                    }
                }

                View {
                    attr {
                        margin(left = 16f, right = 16f, top = 8f)
                        height(40f)
                        backgroundColor(
                            if (ctx.countRunning) Color(0xFFCCCCCC) else Color(0xFF607D8B)
                        )
                        borderRadius(8f)
                        allCenter()
                    }
                    event {
                        click {
                            if (!ctx.countRunning) {
                                ctx.countValue = 0
                                ctx.countRunning = true
                                fun countUp() {
                                    if (ctx.countValue < 100) {
                                        ctx.countValue += 1
                                        ctx.setTimeout(20) { countUp() }
                                    } else {
                                        ctx.countRunning = false
                                    }
                                }
                                countUp()
                            }
                        }
                    }
                    Text {
                        attr {
                            text(if (ctx.countRunning) "计数中..." else "开始计数")
                            fontSize(14f)
                            color(Color.WHITE)
                            fontWeightBold()
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
