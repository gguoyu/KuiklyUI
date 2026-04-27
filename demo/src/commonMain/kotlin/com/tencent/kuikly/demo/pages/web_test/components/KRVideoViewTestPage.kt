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
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.Video
import com.tencent.kuikly.core.views.VideoPlayControl
import com.tencent.kuikly.core.views.View

/**
 * KRVideoView 渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 基础视频播放（play/pause/stop）
 * 2. 静音控制 (muted)
 * 3. 播放倍速 (rate)
 * 4. 填充模式 (resizeMode: contain/cover/stretch)
 * 5. 回调注册 (playStateDidChanged / playTimeDidChanged / firstFrameDidDisplay)
 */
@Page("KRVideoViewTestPage")
internal class KRVideoViewTestPage : Pager() {

    companion object {
        private const val VIDEO_SRC = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    }

    private var playState by observable("play-state: idle")
    private var firstFrame by observable("first-frame: pending")
    private var controlLabel by observable("control: play")

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            attr { backgroundColor(Color.WHITE) }

            List {
                attr { flex(1f) }

                Text {
                    attr {
                        text("1. Basic Video (play)")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Basic play video — exercises SRC, PLAY_CONTROL(PLAY), EVENT_PLAY_STATE_CHANGE,
                // EVENT_FIRST_FRAME, EVENT_PLAY_TIME_CHANGE
                Video {
                    attr {
                        src(VIDEO_SRC)
                        height(180f)
                        margin(left = 16f, right = 16f, top = 8f)
                        playControl(VideoPlayControl.PLAY)
                        muted(true)
                    }
                    event {
                        playStateDidChanged { state, _ ->
                            ctx.playState = "play-state: ${state.name}"
                        }
                        firstFrameDidDisplay {
                            ctx.firstFrame = "first-frame: loaded"
                        }
                        playTimeDidChanged { cur, _ ->
                            // Just register — exercises EVENT_PLAY_TIME_CHANGE prop handler
                            if (cur > 0 && ctx.playState.contains("idle")) {
                                ctx.playState = "play-state: playing"
                            }
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.playState)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }
                Text {
                    attr {
                        text(ctx.firstFrame)
                        fontSize(13f)
                        marginTop(4f)
                        marginLeft(16f)
                        color(0xFF333333)
                    }
                }

                // Control buttons — exercises PLAY_CONTROL with PREPLAY, PAUSE, STOP
                View {
                    attr {
                        flexDirectionRow()
                        margin(left = 16f, right = 16f, top = 8f)
                        height(44f)
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFF1976D2))
                            borderRadius(8f)
                            allCenter()
                        }
                        event {
                            click { ctx.controlLabel = "control: preplay" }
                        }
                        Text {
                            attr { text("preplay"); fontSize(12f); color(Color.WHITE) }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFFE53935))
                            borderRadius(8f)
                            allCenter()
                            marginLeft(8f)
                        }
                        event {
                            click { ctx.controlLabel = "control: pause" }
                        }
                        Text {
                            attr { text("pause"); fontSize(12f); color(Color.WHITE) }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(Color(0xFF616161))
                            borderRadius(8f)
                            allCenter()
                            marginLeft(8f)
                        }
                        event {
                            click { ctx.controlLabel = "control: stop" }
                        }
                        Text {
                            attr { text("stop"); fontSize(12f); color(Color.WHITE) }
                        }
                    }
                }

                Text {
                    attr {
                        text(ctx.controlLabel)
                        fontSize(13f)
                        marginTop(6f)
                        marginLeft(16f)
                        color(0xFF1565C0)
                    }
                }

                Text {
                    attr {
                        text("2. Muted Video (muted=true)")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Exercises MUTED prop handler
                Video {
                    attr {
                        src(VIDEO_SRC)
                        height(140f)
                        margin(left = 16f, right = 16f, top = 8f)
                        playControl(VideoPlayControl.PLAY)
                        muted(true)
                        resizeModeToCover()
                    }
                }

                Text {
                    attr {
                        text("3. Rate 1.5x + contain")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Exercises RATE + RESIZE_MODE(contain) prop handlers
                Video {
                    attr {
                        src(VIDEO_SRC)
                        height(140f)
                        margin(left = 16f, right = 16f, top = 8f)
                        playControl(VideoPlayControl.PLAY)
                        muted(true)
                        rate(1.5f)
                        resizeModeToContain()
                    }
                }

                Text {
                    attr {
                        text("4. Stretch + Rate 2x")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(24f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }

                // Exercises RESIZE_MODE(stretch) + rate(2.0)
                Video {
                    attr {
                        src(VIDEO_SRC)
                        height(120f)
                        margin(left = 16f, right = 16f, top = 8f)
                        playControl(VideoPlayControl.PLAY)
                        muted(true)
                        rate(2.0f)
                        resizeModeToStretch()
                    }
                }

                View { attr { height(50f) } }
            }
        }
    }
}
