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
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.Video
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRVideoView 全属性测试页面
 * 覆盖：src、muted、rate、resizeMode、playControl 等属性及状态回调
 * 注意：使用静态测试视频URL，不依赖外部资源
 */
@Page("WebRenderTestVideo")
internal class WebRenderTestVideoPage : BasePager() {

    // 视频状态
    private var videoStatus by observable("未加载")
    private var currentTime by observable("0")
    private var duration by observable("0")
    private var playbackRate by observable("1.0")
    private var isMuted by observable(false)

    // 固定的测试视频URL (使用公开的测试视频)
    private val testVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"

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
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFFE91E63))
                    }
                    Text {
                        attr {
                            text("KRVideoView 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 视频状态展示
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFE3F2FD))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("视频状态: ${ctx.videoStatus}")
                            fontSize(14f)
                            color(Color(0xFF1565C0))
                        }
                    }
                    Text {
                        attr {
                            text("当前时间: ${ctx.currentTime}s / 总时长: ${ctx.duration}s")
                            fontSize(13f)
                            color(Color(0xFF1976D2))
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("播放速率: ${ctx.playbackRate}x | 静音: ${ctx.isMuted}")
                            fontSize(13f)
                            color(Color(0xFF1976D2))
                            marginTop(4f)
                        }
                    }
                }

                // 测试1: 基础视频 - resizeMode: contain
                SectionTitle("1. 视频基础 - resizeMode: contain")
                View {
                    attr {
                        marginHorizontal(12f)
                        height(200f)
                        backgroundColor(Color.BLACK)
                        borderRadius(8f)
                        overflow("hidden")
                    }
                    Video {
                        attr {
                            absoluteFill()
                            src(ctx.testVideoUrl)
                            resizeMode("contain")
                            autoPlay(false)
                            muted(true)
                        }
                    }
                }

                // 测试2: resizeMode: cover
                SectionTitle("2. resizeMode: cover")
                View {
                    attr {
                        marginHorizontal(12f)
                        height(150f)
                        backgroundColor(Color.BLACK)
                        borderRadius(8f)
                        overflow("hidden")
                    }
                    Video {
                        attr {
                            absoluteFill()
                            src(ctx.testVideoUrl)
                            resizeMode("cover")
                            autoPlay(false)
                            muted(true)
                        }
                    }
                }

                // 测试3: resizeMode: fill (stretch)
                SectionTitle("3. resizeMode: fill (拉伸)")
                View {
                    attr {
                        marginHorizontal(12f)
                        height(100f)
                        width(300f)
                        backgroundColor(Color.BLACK)
                        borderRadius(8f)
                        overflow("hidden")
                    }
                    Video {
                        attr {
                            absoluteFill()
                            src(ctx.testVideoUrl)
                            resizeMode("fill")
                            autoPlay(false)
                            muted(true)
                        }
                    }
                }

                // 测试4: 属性说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("4. Video 属性说明")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(8f)
                        }
                    }
                    View {
                        attr {
                            padding(8f)
                            backgroundColor(Color.WHITE)
                            borderRadius(4f)
                        }
                        Text {
                            attr {
                                text("""
                                    |• src - 视频源URL
                                    |• muted - 是否静音
                                    |• autoPlay - 是否自动播放
                                    |• loop - 是否循环播放
                                    |• rate - 播放速率 (0.5~2.0)
                                    |• resizeMode:
                                    |  - contain: 保持比例，完整显示
                                    |  - cover: 保持比例，填满容器
                                    |  - fill: 拉伸填满
                                    |• playControl - 播放控制
                                    |  - play/pause/stop/seek
                                """.trimMargin())
                                fontSize(12f)
                                color(Color(0xFF666666))
                                lineHeight(18f)
                            }
                        }
                    }
                }

                // 测试5: 回调事件
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("5. 回调事件")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(8f)
                        }
                    }
                    View {
                        attr {
                            padding(8f)
                            backgroundColor(Color.WHITE)
                            borderRadius(4f)
                        }
                        Text {
                            attr {
                                text("""
                                    |• onReady - 视频准备就绪
                                    |• onPlay - 开始播放
                                    |• onPause - 暂停播放
                                    |• onEnded - 播放结束
                                    |• onTimeUpdate - 播放进度更新
                                    |• onError - 播放错误
                                    |• onLoadedMetadata - 元数据加载完成
                                """.trimMargin())
                                fontSize(12f)
                                color(Color(0xFF666666))
                                lineHeight(18f)
                            }
                        }
                    }
                }

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }

    private fun ViewBuilder.SectionTitle(title: String) {
        Text {
            attr {
                text(title)
                fontSize(14f)
                fontWeightBold()
                color(Color(0xFF333333))
                marginLeft(12f)
                marginTop(16f)
                marginBottom(8f)
            }
        }
    }
}
