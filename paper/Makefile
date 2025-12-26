# Makefile for compiling the research paper

LATEX = pdflatex
BIBTEX = bibtex
PAPER = quasiperiodic_functions_paper

all: $(PAPER).pdf

$(PAPER).pdf: $(PAPER).tex
	$(LATEX) $(PAPER)
	$(LATEX) $(PAPER)
	$(LATEX) $(PAPER)

clean:
	rm -f $(PAPER).aux $(PAPER).log $(PAPER).out $(PAPER).toc $(PAPER).bbl $(PAPER).blg

distclean: clean
	rm -f $(PAPER).pdf

.PHONY: all clean distclean