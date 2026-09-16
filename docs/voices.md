# 预生成语音

供应商 MiniMax，模型 `speech-2.8-hd`，音色 `hunyin_6`。当前批次沿用确认过的试听参数：happy、speed 1、vol 1、pitch 0；MP3、32 kHz、128 kbps、单声道。

## 制作与恢复

1. `node --import tsx scripts/voice-catalog.ts`：从现有伙伴、招式、属性和章节数据展开完整句子，按文本去重。不会调用 API。
2. `python3 scripts/generate-voices.py`：检查已有文件并显示剩余数量。不会调用 API。
3. `python3 scripts/generate-voices.py --generate`：明确执行付费合成。只读取本地 `MINIMAX_AUDIO_TTS_API_KEY`；Key 不写入产物。
4. `python3 scripts/verify-voices.py`：核对所有文件的校验和，汇总实际计费字符、时长与体积，生成试听页；全部齐备才发布音频 manifest。

脚本以 3.2 秒间隔提交请求，遵守充值账号默认 20 RPM 限制。每个文件生成后通过 ffmpeg 解码检查。结果保存在 `data/voice/results/`，文件名由文本和全部声音设置的 SHA-256 前 24 位决定；已生成且校验通过的文件会复用。首次皮卡丘试听也复用。

网络中断、超时、生成失败会停止提交新请求，不会自动重试可能已经收费的请求。状态为 submitted 的条目需要人工核实。对于明确返回 1002（请求频率超限）的拒绝，可以等待后用 `--retry-rate-limited` 继续。不要删除整个结果目录重跑。

## 产物

- `data/voice/catalog.json`：预期完整语音清单和合成设置。
- `data/voice/results/*.json`：每条请求的完成状态、实际用量及校验和。
- `data/voice/summary.json`：最近一次完整性检查汇总。
- `public/audio/voices/*.mp3`：可直接部署的预生成音频。
- `public/audio/voices/preview.html`：可搜索的试听列表，播放不会生成新音频。
- `public/audio/voices/manifest.json`：全量完成时生成的文本到 URL 映射。

应用通过 `src/data/voice-index.json` 同步查找完整文案对应的音频，复用同一个 Audio 元素播放；不调用在线生成接口，也不回退到不同音色的系统朗读。对战入口点击时播放选伙伴提示，随后复用该元素播放回合语音。保留停止、互斥、页面离开清理和背景音乐避让事件；缺失文件或播放失败会释放播放状态，不阻塞对战。更新文案后需补生成并运行验证脚本更新索引。

完整句子已经预生成，不需要运行时拼接属性名称。音频按需加载，不一次下载全部 103 MB。文件技术验证不等于逐条人工听审；宝可梦专名、多音字和长段说明仍需试听。
