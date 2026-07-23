import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ============================================================================
// CONSTANTES DE DESIGN & TEMAS
// ============================================================================
const COLORS = {
  background: "#09090e",
  foreground: "#f8fafc",
  card: "#12121a",
  primary: "#d946ef",
  primaryGlow: "rgba(217, 70, 239, 0.15)",
  secondary: "#1e1b4b",
  muted: "#181822",
  mutedForeground: "#94a3b8",
  accent: "#3b0764",
  border: "#272733",
  userBubble: "#2e1065",
  amberGlow: "rgba(245, 158, 11, 0.1)",
  amberBorder: "rgba(245, 158, 11, 0.3)",
  amberText: "#fbbf24",
};

const SUGGESTIONS = [
  "Histórias raras para vídeos de mistério",
  "Arquivos públicos obscuros sobre a Guerra Fria",
  "Projetos open source de IA generativa no GitHub",
  "Fóruns antigos e comunidades perdidas na web",
];

// O limite de saída (links/caracteres) que a IA consegue enviar em uma única resposta
const MAX_AI_OUTPUT_LIMIT = 10001;

// ============================================================================
// PARSER INLINE DE MARKDOWN
// ============================================================================
const MarkdownText = ({ text }) => {
  if (!text) return null;

  const paragraphs = text.split("\n");

  return (
    <View style={styles.markdownContainer}>
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return <View key={pIdx} style={{ height: 8 }} />;

        if (trimmed.startsWith("##")) {
          const titleText = trimmed.replace(/^##+\s*/, "");
          return <Text key={pIdx} style={styles.mdHeader}>{titleText}</Text>;
        }

        const isListItem = trimmed.startsWith("-") || trimmed.startsWith("*");
        const cleanPara = isListItem ? trimmed.replace(/^[-*]\s*/, "") : para;

        const tokenRegex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)/g;
        const parts = cleanPara.split(tokenRegex);

        return (
          <View key={pIdx} style={isListItem ? styles.mdListItem : styles.mdParagraph}>
            {isListItem && <Text style={styles.mdBullet}>• </Text>}
            <Text style={styles.mdText}>
              {parts.map((part, partIdx) => {
                if (!part) return null;

                if (part.startsWith("[") && part.includes("](")) {
                  const label = part.substring(1, part.indexOf("]("));
                  const url = part.substring(part.indexOf("](") + 2, part.length - 1);
                  return (
                    <Text key={partIdx} style={styles.mdLink} onPress={() => Linking.openURL(url)}>
                      {label}
                    </Text>
                  );
                }

                if (part.startsWith("**") && part.endsWith("**")) {
                  const boldText = part.substring(2, part.length - 2);
                  return <Text key={partIdx} style={styles.mdBold}>{boldText}</Text>;
                }

                return <Text key={partIdx}>{part}</Text>;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ============================================================================
// ICONE DE DIAMANTE
// ============================================================================
const DiamondLogo = ({ size = 60 }) => (
  <View style={[styles.logoContainer, { width: size, height: size }]}>
    <View style={[styles.diamondGlow, { width: size * 0.7, height: size * 0.7 }]} />
    <View style={[styles.diamondShape, { width: size * 0.6, height: size * 0.6 }]}>
      <View style={styles.diamondFacetTop} />
      <View style={styles.diamondFacetBottom} />
    </View>
  </View>
);

// ============================================================================
// SIMULADOR DE CONTEÚDO RARO (Inteligência Artificial Local Raro AI)
// ============================================================================
const generateRaroAiResponse = (prompt, files = []) => {
  const query = prompt.toLowerCase().trim();
  let aiResponse = "";

  // 1. Tratar imagens/arquivos anexados primeiro
  if (files && files.length > 0) {
    const isImagePrompt = /^(olha|veja|vê|analisa|foto|imagem|arquivo|documento|o que|isso)/i.test(query);
    if (isImagePrompt || query.length <= 25) {
      aiResponse = `Iniciando escaneamento do arquivo **${files[0]}**... 👁️\n\nComo estou rodando em uma interface simulada neste aplicativo, minha visão computacional está temporariamente offline.\n\nNo entanto, se você me descrever os detalhes, nomes ou símbolos contidos nessa imagem, posso cruzar essas informações com bancos de dados vazados, registros da CIA ou acervos do Internet Archive.`;
    }
  }

  // Se não for arquivo, processa o texto normalmente
  if (!aiResponse) {
    // 2. Filtro Inteligente para Saudações
    const isGreeting = /^(oi+|olá+|ola+|bom dia|boa tarde|boa noite|tudo bem\??|ei|hey|hello|eae|opa)[!?]*$/i.test(query);
    if (isGreeting || query.length <= 2) {
      aiResponse = `Saudações, explorador(a)! 👋 Eu sou a **Raro AI**, uma inteligência artificial projetada para encontrar o que a maioria não consegue.

Não sou muito de conversa fiada, meu negócio é encontrar tesouros digitais escondidos. O que você quer que eu rastreie hoje?
- 📂 Arquivos desclassificados
- 🌐 Fóruns obscuros
- 💻 Projetos Open Source raros
- 🕵️ Histórias de mistério`;
    }

    // 3. Filtro de Identidade
    else if (/quem (é|e) voc(e|ê)|o que (é|e) voc(e|ê)|o que voc(e|ê) faz/i.test(query)) {
      aiResponse = `Eu sou a **Raro AI**, uma caçadora de artefatos digitais. Fui treinada para vasculhar a internet profunda, arquivos governamentais, repositórios de código aberto e fóruns obscuros.

Me dê um tema e eu trarei documentos e links que poucas pessoas conhecem.`;
    }

    // 4. Respostas Temáticas
    else if (query.includes("mistério") || query.includes("história") || query.includes("secreto")) {
      aiResponse = `Aqui estão algumas descobertas intrigantes e esquecidas no fundo da rede, perfeitas para roteiros envolventes:

## 1. O Mistério da Transmissão de Max Headroom (1987)
Um dos incidentes mais bizarros de pirataria de sinal de TV na história dos EUA. Um invasor mascarado interrompeu transmissões em Chicago e nunca foi identificado.
- **Tipo:** Caso Real / Hack Histórico
- **🔗 Fonte no Reddit:** [Discussões e Teorias](https://www.reddit.com/search/?q=Max+Headroom+Broadcast+Intrusion)
- **🔗 Registro no Youtube:** [Gravação Original da Transmissão](https://www.youtube.com/results?search_query=Max+Headroom+Incident+1987)

## 2. O Incidente do Desfiladeiro Dyatlov (Arquivos Soviéticos)
O misterioso desaparecimento e morte de nove esquiadores nos Montes Urais em 1959. Teorias variam de infrassom a testes militares secretos.
- **Tipo:** Documentos Desclassificados
- **🔗 Documentação Histórica:** [Internet Archive — Dyatlov Pass Files](https://archive.org/search?query=Dyatlov+Pass+Incident)`;
    }

    else if (query.includes("guerra fria") || query.includes("público") || query.includes("governo") || query.includes("cia")) {
      aiResponse = `Minhas buscas nos arquivos abertos revelaram esses repositórios raros com inteligência e documentos desclassificados:

## 1. Arquivos Secretos da CIA (CREST)
Milhões de páginas de documentos da Guerra Fria desclassificados, cobrindo avistamentos de OVNIs e projetos de controle mental.
- **Tipo:** Arquivo Governamental
- **🔗 Busca no Internet Archive:** [CIA CREST Documents](https://archive.org/search?query=CIA+CREST+collection)

Qual dessas conspirações reais você gostaria de decodificar mais a fundo?`;
    }

    else if (query.includes("github") || query.includes("open source") || query.includes("projeto") || query.includes("ia") || query.includes("código")) {
      aiResponse = `Incrível escolha. A vanguarda do desenvolvimento livre esconde projetos excepcionais. Vasculhei o código aberto e destaco:

## 1. Motores de IA de Áudio Locais (Bark & Coqui)
Geradores de voz e clonagem de voz extremamente realistas que você pode rodar 100% offline no seu computador sem depender de nuvens pagas.
- **Tipo:** Repositório do GitHub / IA
- **🔗 Código Fonte:** [GitHub — Coqui TTS Repo](https://github.com/search?q=Coqui+TTS&type=repositories)
- **🔗 Modelos Prontos:** [Hugging Face — Bark Text-to-Audio](https://huggingface.co/search/full-text?q=suno+bark)

Gostaria de ajuda para configurar ou encontrar o guia de instalação de algum desses repositórios?`;
    }

    // 5. Resposta Genérica
    else {
      const cleanPrompt = prompt.replace(/[?.,!]/g, "").trim();
      const searchTerms = encodeURIComponent(cleanPrompt);

      aiResponse = `Saudações. Minhas sondagens indicam que o tema **"${cleanPrompt}"** guarda segredos fascinantes.

## 1. Registros e Mídias no Internet Archive
O maior acervo de preservação digital do mundo.
- **Tipo:** Acervo de Preservação Geral
- **🔗 Busca Direta:** [Internet Archive — ${cleanPrompt}](https://archive.org/search?query=${searchTerms})

## 2. Discussões Profundas no Reddit
Comunidades nichadas discutem tópicos raros e compartilham links raramente indexados pelo Google.
- **Tipo:** Fórum / Comunidade Digital
- **🔗 Tópicos de Discussão:** [Pesquisar Reddit por ${cleanPrompt}](https://www.reddit.com/search/?q=${searchTerms})

Posso refinar a busca se você for mais específico(a). O que exatamente procura sobre isso?`;
    }
  }

  // Aplica o limite da IA: garante que ela não envie mais do que MAX_AI_OUTPUT_LIMIT caracteres/links.
  if (aiResponse.length > MAX_AI_OUTPUT_LIMIT) {
    aiResponse = aiResponse.substring(0, MAX_AI_OUTPUT_LIMIT);
  }

  return aiResponse;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function App() {
  const [threads, setThreads] = useState([
    {
      id: "1",
      title: "Arquivos Soviéticos Raros",
      messages: [
        { id: "1-1", role: "user", text: "Me mostre documentos secretos sobre o desfiladeiro Dyatlov" },
        { id: "1-2", role: "assistant", text: generateRaroAiResponse("desfiladeiro Dyatlov") },
      ],
    },
  ]);
  const [currentThreadId, setCurrentThreadId] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [pendingFiles, setPendingFiles] = useState([]); 
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const sidebarAnim = useRef(new Animated.Value(-300)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [sidebarOpen]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === currentThreadId) || null;
  }, [threads, currentThreadId]);

  const messages = activeThread ? activeThread.messages : [];

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSelectThread = (id) => {
    setCurrentThreadId(id);
    setSidebarOpen(false);
    setMusicPlaying(false);
    setSpeakingId(null);
  };

  const handleNewThread = () => {
    const newId = Math.random().toString();
    const newT = {
      id: newId,
      title: "Nova busca rara",
      messages: [],
    };
    setThreads((prev) => [newT, ...prev]);
    setCurrentThreadId(newId);
    setSidebarOpen(false);
  };

  const handleDeleteThread = (id) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (currentThreadId === id) {
      setCurrentThreadId("");
    }
  };

  const handleSend = async (customText = "") => {
    const textToSend = customText || input.trim();
    if (!textToSend && pendingFiles.length === 0) return;

    let activeId = currentThreadId;
    if (!activeId) {
      const newId = Math.random().toString();
      const newT = {
        id: newId,
        title: textToSend.substring(0, 30) || "Nova busca",
        messages: [],
      };
      setThreads([newT]);
      activeId = newId;
      setCurrentThreadId(newId);
    }

    const filesToSend = [...pendingFiles];

    const newUserMsg = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      files: filesToSend,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeId) {
          const updatedMsgs = [...t.messages, newUserMsg];
          const updatedTitle = t.messages.length === 0 ? textToSend.substring(0, 30) : t.title;
          return { ...t, title: updatedTitle, messages: updatedMsgs };
        }
        return t;
      })
    );

    setInput("");
    setPendingFiles([]);
    setIsLoading(true);
    scrollToBottom();

    setTimeout(() => {
      // Passa os arquivos para a IA ver
      const assistantText = generateRaroAiResponse(textToSend, filesToSend);
      const newAssistantMsg = {
        id: Math.random().toString(),
        role: "assistant",
        text: assistantText,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeId) {
            return { ...t, messages: [...t.messages, newAssistantMsg] };
          }
          return t;
        })
      );
      setIsLoading(false);
      scrollToBottom();
    }, 1500);
  };

  const handleAttachImage = () => {
    const mockFiles = [
      "Scan_Documento_1962.jpg",
      "Mapa_Perdido_Dyatlov.png",
      "Foto_Antiga_Siberia.jpg",
      "Manuscrito_Desconhecido.pdf"
    ];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setPendingFiles((prev) => [...prev, randomFile]);
  };

  const handleRecordAudio = () => {
    if (recording) {
      setRecording(false);
      setTranscribing(true);
      setTimeout(() => {
        setTranscribing(false);
        setInput("Projetos open source intrigantes no GitHub");
      }, 1200);
    } else {
      setRecording(true);
    }
  };

  const handleGenerateMusic = () => {
    if (!input.trim()) {
      alert("Escreva uma descrição para a trilha sonora no campo de texto primeiro.");
      return;
    }
    setMusicPrompt(input.trim());
    setMusicPlaying(true);
  };

  const handleSpeak = (id) => {
    if (speakingId === id) {
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
    }
  };

  const handleSave = async () => {
    if (messages.length === 0) return;
    const lines = ["# Busca Raro AI", ""];
    messages.forEach((m) => {
      const who = m.role === "user" ? "Você" : "Raro AI";
      lines.push(`## ${who}`, m.text, "");
    });

    try {
      await Share.share({
        message: lines.join("\n"),
        title: "Minha busca Raro AI",
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* HEADER PRINCIPAL */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerButton}>
            <Ionicons name="menu" size={24} color={COLORS.foreground} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <DiamondLogo size={32} />
            <Text style={styles.headerTitle}>Raro AI</Text>
          </View>

          <TouchableOpacity onPress={handleSave} disabled={messages.length === 0} style={styles.headerButton}>
            <Ionicons name="share-outline" size={22} color={messages.length > 0 ? COLORS.foreground : COLORS.border} />
          </TouchableOpacity>
        </View>

        {/* AVISO LEGAL DISMISSÍVEL */}
        {!noticeDismissed && (
          <View style={styles.warningBanner}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.amberText} style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Não apoiamos pirataria ou infrações. Consulte os arquivos abertos de forma legal.{" "}
              <Text style={styles.warningLink} onPress={() => setNoticeOpen(true)}>
                Aviso legal.
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setNoticeDismissed(true)}>
              <Ionicons name="close" size={18} color={COLORS.amberText} />
            </TouchableOpacity>
          </View>
        )}

        {/* ÁREA DE CONTEÚDO (MENSAGENS) */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <DiamondLogo size={70} />
              <Text style={styles.emptyTitle}>
                O que vamos <Text style={styles.purpleGradientText}>descobrir</Text> hoje?
              </Text>
              <Text style={styles.emptySubtitle}>
                Páginas perdidas, arquivos raros, dados desclassificados... Faça buscas avançadas.
              </Text>

              <View style={styles.suggestionsContainer}>
                {SUGGESTIONS.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.suggestionCard} onPress={() => handleSend(item)}>
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <View key={m.id} style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAssistant]}>
                  <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                    {m.files && m.files.map((file, fIdx) => (
                      <View key={fIdx} style={styles.attachedFileBadge}>
                        <Ionicons name="image-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.attachedFileText}>{file}</Text>
                      </View>
                    ))}
                    <MarkdownText text={m.text} />
                  </View>

                  {!isUser && (
                    <View style={styles.assistantActions}>
                      <TouchableOpacity onPress={() => handleSpeak(m.id)} style={styles.actionButtonMini}>
                        <Ionicons
                          name={speakingId === m.id ? "volume-mute" : "volume-medium"}
                          size={16}
                          color={COLORS.mutedForeground}
                        />
                        <Text style={styles.actionButtonMiniText}>
                          {speakingId === m.id ? "Parar áudio" : "Ouvir"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {isLoading && (
            <View style={[styles.messageRow, styles.rowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.shimmerText}>Garimpando o acervo profundo...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* INPUT E AÇÕES - SEMPRE NO FINAL DA TELA */}
        <View style={styles.footerContainer}>
          {pendingFiles.length > 0 && (
            <View style={styles.pendingFilesRow}>
              {pendingFiles.map((file, idx) => (
                <View key={idx} style={styles.pendingFileTag}>
                  <Ionicons name="document-attach" size={14} color={COLORS.primary} />
                  <Text style={styles.pendingFileName} numberOfLines={1}>{file}</Text>
                  <TouchableOpacity onPress={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="close-circle" size={16} color={COLORS.foreground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {musicPlaying && (
            <View style={styles.musicCard}>
              <View style={styles.musicCardHeader}>
                <Ionicons name="musical-notes" size={16} color={COLORS.primary} />
                <Text style={styles.musicTitle} numberOfLines={1}>Trilha: {musicPrompt}</Text>
                <TouchableOpacity onPress={() => setMusicPlaying(false)}>
                  <Ionicons name="close" size={16} color={COLORS.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.musicPlayerMock}>
                <Ionicons name="play-circle" size={28} color={COLORS.primary} />
                <View style={styles.musicProgressBar} />
                <Text style={styles.musicTimer}>0:12 / 0:30</Text>
              </View>
            </View>
          )}

          <View style={styles.inputArea}>
            <TouchableOpacity onPress={handleAttachImage} style={styles.inputActionButton} disabled={recording}>
              <Ionicons name="attach" size={22} color={COLORS.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRecordAudio} style={[styles.inputActionButton, recording && styles.micActive]} disabled={isLoading}>
              <Ionicons name={recording ? "square" : "mic"} size={20} color={recording ? COLORS.foreground : COLORS.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGenerateMusic} style={styles.inputActionButton} disabled={!input.trim()}>
              <Ionicons name="musical-note" size={20} color={input.trim() ? COLORS.primary : COLORS.mutedForeground} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={recording ? "Gravando áudio..." : transcribing ? "Transcrevendo..." : "Rastrear conteúdo raro..."}
              placeholderTextColor={COLORS.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!recording && !transcribing}
            />

            <TouchableOpacity onPress={() => handleSend()} style={styles.sendButton} disabled={isLoading || recording}>
              <Ionicons name="arrow-up" size={20} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* DRAWER / SIDEBAR */}
      {sidebarOpen && (
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={() => setSidebarOpen(false)}>
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: sidebarAnim }] }]}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerHeaderTitle}>Buscas Recentes</Text>
              <TouchableOpacity onPress={handleNewThread} style={styles.newChatButton}>
                <Ionicons name="add" size={20} color={COLORS.primary} />
                <Text style={styles.newChatButtonText}>Nova</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerList}>
              {threads.map((t) => {
                const isActive = t.id === currentThreadId;
                return (
                  <View key={t.id} style={[styles.drawerItem, isActive && styles.drawerItemActive]}>
                    <TouchableOpacity onPress={() => handleSelectThread(t.id)} style={{ flex: 1 }}>
                      <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]} numberOfLines={1}>
                        {t.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteThread(t.id)}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <Text style={styles.drawerFooter}>Raro AI v1.2 — Preservação Criptográfica</Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* DIALOG DE AVISO LEGAL */}
      <Modal visible={noticeOpen} transparent animationType="fade" onRequestClose={() => setNoticeOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.amberText} />
              <Text style={styles.modalTitle}>Aviso Legal & Termos</Text>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalParagraph}>
                A <Text style={{ fontWeight: "bold" }}>Raro AI</Text> é uma plataforma educacional para facilitação de buscas públicas de arquivologia, código aberto e tesouros de história digital de difícil acesso.
              </Text>
              <Text style={styles.modalParagraph}>
                Nenhum arquivo pirata, material infrator ou quebra de direitos autorais é hospedado, promovido ou recomendado ativamente.
              </Text>
              <Text style={styles.modalParagraph}>
                Ao prosseguir, você concorda em utilizar as informações e links gerados estritamente sob as leis de direitos autorais aplicáveis em sua região de acesso.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setNoticeOpen(false)}>
              <Text style={styles.modalCloseButtonText}>Compreendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLESHEET COMPLETO
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.foreground,
  },
  warningBanner: {
    backgroundColor: COLORS.amberGlow,
    borderColor: COLORS.amberBorder,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    gap: 8,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    color: COLORS.foreground,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  warningLink: {
    textDecorationLine: "underline",
    color: COLORS.amberText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.foreground,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
  purpleGradientText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  suggestionsContainer: {
    width: "100%",
    marginTop: 32,
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  suggestionText: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "500",
  },
  messageRow: {
    marginBottom: 20,
    maxWidth: "85%",
  },
  rowUser: {
    alignSelf: "flex-end",
  },
  rowAssistant: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleUser: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attachedFileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  attachedFileText: {
    color: COLORS.foreground,
    fontSize: 11,
  },
  shimmerText: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    marginTop: 4,
  },
  assistantActions: {
    flexDirection: "row",
    marginTop: 6,
    paddingLeft: 4,
  },
  actionButtonMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  actionButtonMiniText: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "600",
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.background,
  },
  pendingFilesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  pendingFileTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  pendingFileName: {
    color: COLORS.foreground,
    fontSize: 12,
    maxWidth: 120,
  },
  musicCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 70, 239, 0.3)",
    padding: 12,
    marginBottom: 10,
  },
  musicCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  musicTitle: {
    color: COLORS.foreground,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 8,
  },
  musicPlayerMock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  musicProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  musicTimer: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontFamily: "monospace",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  inputActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  micActive: {
    backgroundColor: COLORS.primary,
  },
  input: {
    flex: 1,
    color: COLORS.foreground,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 99,
  },
  drawer: {
    width: 280,
    height: "100%",
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  drawerHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.foreground,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newChatButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  drawerList: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: COLORS.muted,
  },
  drawerItemText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
  },
  drawerItemTextActive: {
    color: COLORS.foreground,
    fontWeight: "600",
  },
  drawerFooter: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.foreground,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalParagraph: {
    color: COLORS.foreground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: COLORS.foreground,
    fontWeight: "700",
    fontSize: 14,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  diamondGlow: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    opacity: 0.35,
    filter: "blur(12px)",
  },
  diamondShape: {
    justifyContent: "center",
    alignItems: "center",
  },
  diamondFacetTop: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: COLORS.primary,
    transform: [{ rotate: "180deg" }],
  },
  diamondFacetBottom: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.primary,
    marginTop: -2,
  },
  markdownContainer: {
    width: "100%",
  },
  mdHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.foreground,
    marginTop: 12,
    marginBottom: 6,
  },
  mdParagraph: {
    marginBottom: 6,
  },
  mdListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingLeft: 4,
  },
  mdBullet: {
    color: COLORS.primary,
    fontSize: 14,
    lineHeight: 18,
  },
  mdText: {
    color: COLORS.foreground,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  mdBold: {
    fontWeight: "700",
    color: COLORS.foreground,
  },
  mdLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});