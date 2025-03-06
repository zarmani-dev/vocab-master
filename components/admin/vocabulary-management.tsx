"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Wand2, Volume2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { supabase, type Vocabulary, type User } from "@/lib/supabase";
import {
  generateAIExamples,
  generatePronunciation,
  generateVocabularyWithAI,
} from "@/lib/ai-service";
import { useToast } from "@/components/ui/use-toast";
import { VocabularyPreview } from "./vocabulary-preview";

export function VocabularyManagement() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddVocabOpen, setIsAddVocabOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingVocabulary, setIsGeneratingVocabulary] = useState(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [isGeneratingPronunciation, setIsGeneratingPronunciation] =
    useState(false);
  const [previewVocab, setPreviewVocab] = useState<Vocabulary | null>(null);
  const [newVocab, setNewVocab] = useState({
    word: "",
    cefr: "B2",
    part_of_speech: "noun",
    pronunciation: "",
    definition: "",
    examples: [""],
    audio_url: "",
    assigned_to: [],
  });
  const [generateParams, setGenerateParams] = useState({
    level: "B2",
    count: 5,
    topic: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVocabulary();
    fetchUsers();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const { data, error } = await supabase
        .from("vocabulary")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVocabulary(data || []);
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vocabulary",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, name")
        .eq("role", "user");

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAddExample = () => {
    setNewVocab({
      ...newVocab,
      examples: [...newVocab.examples, ""],
    });
  };

  const handleExampleChange = (index: number, value: string) => {
    const updatedExamples = [...newVocab.examples];
    updatedExamples[index] = value;
    setNewVocab({
      ...newVocab,
      examples: updatedExamples,
    });
  };

  const handleAddVocab = async () => {
    try {
      // Get the current user ID from localStorage
      const userString = localStorage.getItem("user");
      if (!userString) throw new Error("User not found");
      const user = JSON.parse(userString);

      const { data, error } = await supabase
        .from("vocabulary")
        .insert([
          {
            word: newVocab.word,
            cefr: newVocab.cefr,
            part_of_speech: newVocab.part_of_speech,
            pronunciation: newVocab.pronunciation,
            definition: newVocab.definition,
            examples: newVocab.examples.filter((e) => e.trim()),
            audio_url: newVocab.audio_url,
            created_by: user.id,
          },
        ])
        .select();

      if (error) throw error;

      setVocabulary([data[0], ...vocabulary]);
      setNewVocab({
        word: "",
        cefr: "B2",
        part_of_speech: "noun",
        pronunciation: "",
        definition: "",
        examples: [""],
        audio_url: "",
        assigned_to: [],
      });
      setIsAddVocabOpen(false);

      toast({
        title: "Success",
        description: "Vocabulary added successfully",
      });
    } catch (error) {
      console.error("Error adding vocabulary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add vocabulary",
      });
    }
  };

  const handleDeleteVocab = async (id: number) => {
    try {
      const { error } = await supabase.from("vocabulary").delete().eq("id", id);

      if (error) throw error;

      setVocabulary(vocabulary.filter((v) => v.id !== id));

      toast({
        title: "Success",
        description: "Vocabulary deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting vocabulary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete vocabulary",
      });
    }
  };

  const handleGenerateExamples = async () => {
    if (!newVocab.word) return;

    setIsGeneratingExamples(true);
    try {
      const examples = await generateAIExamples(newVocab.word);
      setNewVocab({
        ...newVocab,
        examples: examples,
      });

      toast({
        title: "Success",
        description: "Examples generated successfully",
      });
    } catch (error) {
      console.error("Error generating examples:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate examples",
      });
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  const handleGeneratePronunciation = async () => {
    if (!newVocab.word) return;

    setIsGeneratingPronunciation(true);
    try {
      const { pronunciation, audioUrl } = await generatePronunciation(
        newVocab.word
      );
      setNewVocab({
        ...newVocab,
        pronunciation,
        audio_url: audioUrl,
      });

      toast({
        title: "Success",
        description: "Pronunciation generated successfully",
      });
    } catch (error) {
      console.error("Error generating pronunciation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate pronunciation",
      });
    } finally {
      setIsGeneratingPronunciation(false);
    }
  };

  const handleGenerateVocabulary = async () => {
    setIsGeneratingVocabulary(true);
    try {
      // Call the AI service to generate vocabulary
      const generatedWords = await generateVocabularyWithAI(
        generateParams.level,
        generateParams.count,
        generateParams.topic || undefined
      );

      // Get the current user ID from localStorage
      const userString = localStorage.getItem("user");
      if (!userString) throw new Error("User not found");
      const user = JSON.parse(userString);

      // Format the generated words for insertion into the database
      const wordsToInsert = generatedWords.map((word) => ({
        word: word.word,
        cefr: generateParams.level,
        part_of_speech: word.part_of_speech,
        pronunciation: word.pronunciation,
        definition: word.definition,
        examples: word.examples,
        audio_url: "",
        created_by: user.id,
        created_at: new Date().toISOString(),
      }));

      // Insert the generated words into the database
      const { data, error } = await supabase
        .from("vocabulary")
        .insert(wordsToInsert)
        .select();

      if (error) throw error;

      // Update the vocabulary state with the new words
      setVocabulary([...data, ...vocabulary]);
      setIsGenerateOpen(false);

      toast({
        title: "Success",
        description: `${data.length} vocabulary words generated successfully`,
      });
    } catch (error) {
      console.error("Error generating vocabulary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate vocabulary. Please try again.",
      });
    } finally {
      setIsGeneratingVocabulary(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.play();
  };

  const handlePreview = (vocab: Vocabulary) => {
    setPreviewVocab(vocab);
  };

  const handleAssignToUsers = async (userIds: number[]) => {
    if (!previewVocab || userIds.length === 0) return;

    try {
      // Create entries in user_vocabulary table
      const userVocabEntries = userIds.map((userId) => ({
        user_id: userId,
        vocabulary_id: previewVocab.id,
        assigned_date: new Date().toISOString().split("T")[0],
        is_learned: false,
      }));

      const { error } = await supabase
        .from("user_vocabulary")
        .upsert(userVocabEntries, { onConflict: "user_id,vocabulary_id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vocabulary assigned to ${userIds.length} ${
          userIds.length === 1 ? "user" : "users"
        }`,
      });

      setPreviewVocab(null);
    } catch (error) {
      console.error("Error assigning vocabulary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign vocabulary to users",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vocabulary Management</h2>
        <div className="flex gap-2">
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Vocabulary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Vocabulary with AI</DialogTitle>
                <DialogDescription>
                  Generate vocabulary words based on CEFR level and topic.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="level" className="text-right">
                    CEFR Level
                  </Label>
                  <Select
                    value={generateParams.level}
                    onValueChange={(value) =>
                      setGenerateParams({ ...generateParams, level: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="count" className="text-right">
                    Number of Words
                  </Label>
                  <Input
                    id="count"
                    type="number"
                    value={generateParams.count}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        count: Number.parseInt(e.target.value),
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="topic" className="text-right">
                    Topic (Optional)
                  </Label>
                  <Input
                    id="topic"
                    value={generateParams.topic}
                    onChange={(e) =>
                      setGenerateParams({
                        ...generateParams,
                        topic: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="e.g., Business, Technology, Travel"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleGenerateVocabulary}
                  disabled={isGeneratingVocabulary}
                >
                  {isGeneratingVocabulary ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddVocabOpen} onOpenChange={setIsAddVocabOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vocabulary
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Vocabulary</DialogTitle>
                <DialogDescription>
                  Add a new vocabulary word with Oxford dictionary format.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="word" className="text-right">
                    Word
                  </Label>
                  <Input
                    id="word"
                    value={newVocab.word}
                    onChange={(e) =>
                      setNewVocab({ ...newVocab, word: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cefr" className="text-right">
                    CEFR Level
                  </Label>
                  <Select
                    value={newVocab.cefr}
                    onValueChange={(value) =>
                      setNewVocab({ ...newVocab, cefr: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partOfSpeech" className="text-right">
                    Part of Speech
                  </Label>
                  <Select
                    value={newVocab.part_of_speech}
                    onValueChange={(value) =>
                      setNewVocab({ ...newVocab, part_of_speech: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select part of speech" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Noun</SelectItem>
                      <SelectItem value="verb">Verb</SelectItem>
                      <SelectItem value="adjective">Adjective</SelectItem>
                      <SelectItem value="adverb">Adverb</SelectItem>
                      <SelectItem value="preposition">Preposition</SelectItem>
                      <SelectItem value="conjunction">Conjunction</SelectItem>
                      <SelectItem value="pronoun">Pronoun</SelectItem>
                      <SelectItem value="interjection">Interjection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pronunciation" className="text-right">
                    Pronunciation
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="pronunciation"
                      value={newVocab.pronunciation}
                      onChange={(e) =>
                        setNewVocab({
                          ...newVocab,
                          pronunciation: e.target.value,
                        })
                      }
                      className="flex-1"
                      placeholder="/ˈprəʊnʌnsɪeɪʃ(ə)n/"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePronunciation}
                      disabled={!newVocab.word || isGeneratingPronunciation}
                    >
                      {isGeneratingPronunciation ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Generate Pronunciation</span>
                    </Button>
                    {newVocab.audio_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => playAudio(newVocab.audio_url)}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Play Pronunciation</span>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="definition" className="text-right">
                    Definition
                  </Label>
                  <Textarea
                    id="definition"
                    value={newVocab.definition}
                    onChange={(e) =>
                      setNewVocab({ ...newVocab, definition: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Examples</Label>
                  <div className="col-span-3 space-y-2">
                    {newVocab.examples.map((example, index) => (
                      <Textarea
                        key={index}
                        value={example}
                        onChange={(e) =>
                          handleExampleChange(index, e.target.value)
                        }
                        placeholder={`Example sentence ${index + 1}`}
                      />
                    ))}
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddExample}
                      >
                        Add Example
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateExamples}
                        disabled={!newVocab.word || isGeneratingExamples}
                      >
                        {isGeneratingExamples ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Generate Examples
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddVocab}>Add Vocabulary</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary List</CardTitle>
          <CardDescription>
            Manage vocabulary words and assign them to users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>CEFR</TableHead>
                  <TableHead>Part of Speech</TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>Pronunciation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vocabulary.map((vocab) => (
                  <TableRow key={vocab.id}>
                    <TableCell className="font-medium">{vocab.word}</TableCell>
                    <TableCell>{vocab.cefr}</TableCell>
                    <TableCell>{vocab.part_of_speech}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {vocab.definition}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      {vocab.pronunciation}
                      {vocab.audio_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => playAudio(vocab.audio_url || "")}
                        >
                          <Volume2 className="h-4 w-4" />
                          <span className="sr-only">Play</span>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(vocab)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Preview</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVocab(vocab.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewVocab && (
        <VocabularyPreview
          vocabulary={previewVocab}
          isOpen={!!previewVocab}
          onClose={() => setPreviewVocab(null)}
          onAssign={handleAssignToUsers}
          users={users}
        />
      )}
    </motion.div>
  );
}
